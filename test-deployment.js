// 部署测试脚本
// 使用方法: node test-deployment.js <your-railway-url>

const axios = require('axios');

const RAILWAY_URL = process.argv[2] || process.env.RAILWAY_URL;

if (!RAILWAY_URL) {
  console.error('❌ 请提供 Railway URL');
  console.log('使用方法: node test-deployment.js https://your-app.up.railway.app');
  console.log('或设置环境变量: RAILWAY_URL=https://your-app.up.railway.app node test-deployment.js');
  process.exit(1);
}

const baseURL = RAILWAY_URL.replace(/\/$/, ''); // 移除末尾斜杠

console.log('🚀 开始测试 Railway 部署...\n');
console.log(`📍 测试 URL: ${baseURL}\n`);

async function testHealthCheck() {
  try {
    console.log('1️⃣ 测试健康检查端点...');
    const response = await axios.get(`${baseURL}/api/health`);
    if (response.data.status === 'OK') {
      console.log('✅ 健康检查通过:', response.data);
      return true;
    } else {
      console.log('❌ 健康检查失败:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ 健康检查失败:', error.message);
    return false;
  }
}

async function testRootEndpoint() {
  try {
    console.log('\n2️⃣ 测试根端点...');
    const response = await axios.get(`${baseURL}/`);
    if (response.data.message) {
      console.log('✅ 根端点正常:', response.data.message);
      console.log('   可用端点:', Object.keys(response.data.endpoints || {}));
      return true;
    } else {
      console.log('❌ 根端点响应异常:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ 根端点测试失败:', error.message);
    return false;
  }
}

async function testSearchEndpoint() {
  try {
    console.log('\n3️⃣ 测试搜索端点（需要环境变量）...');
    
    // 检查是否有必要的环境变量
    if (!process.env.OPENAI_API_KEY || !process.env.GOOGLE_MAPS_API_KEY) {
      console.log('⚠️  跳过搜索测试（需要 OPENAI_API_KEY 和 GOOGLE_MAPS_API_KEY）');
      return true;
    }

    const testData = {
      query: '附近的日式餐廳',
      location: {
        lat: 25.0330,
        lng: 121.5654
      }
    };

    const response = await axios.post(`${baseURL}/api/search`, testData, {
      timeout: 30000 // 30秒超时
    });

    if (response.data.success) {
      console.log('✅ 搜索功能正常');
      console.log(`   找到 ${response.data.count} 间餐厅`);
      if (response.data.analysis) {
        console.log('   AI 分析:', response.data.analysis);
      }
      return true;
    } else {
      console.log('❌ 搜索功能异常:', response.data);
      return false;
    }
  } catch (error) {
    if (error.response) {
      console.log('❌ 搜索测试失败:', error.response.data);
    } else {
      console.log('❌ 搜索测试失败:', error.message);
    }
    return false;
  }
}

async function runTests() {
  const results = {
    healthCheck: false,
    rootEndpoint: false,
    searchEndpoint: false
  };

  results.healthCheck = await testHealthCheck();
  results.rootEndpoint = await testRootEndpoint();
  results.searchEndpoint = await testSearchEndpoint();

  console.log('\n' + '='.repeat(50));
  console.log('📊 测试结果总结:');
  console.log('='.repeat(50));
  console.log(`健康检查: ${results.healthCheck ? '✅' : '❌'}`);
  console.log(`根端点: ${results.rootEndpoint ? '✅' : '❌'}`);
  console.log(`搜索端点: ${results.searchEndpoint ? '✅' : '⚠️'}`);
  console.log('='.repeat(50));

  const allPassed = results.healthCheck && results.rootEndpoint;
  
  if (allPassed) {
    console.log('\n🎉 基本功能测试通过！');
    console.log('\n📝 下一步:');
    console.log('1. 在 Railway 中检查环境变量是否都已设置');
    console.log('2. 如果前端已部署，更新 REACT_APP_API_URL 环境变量');
    console.log('3. 查看 POST_DEPLOYMENT_STEPS.md 获取详细指南');
  } else {
    console.log('\n⚠️  部分测试失败，请检查:');
    console.log('1. Railway 部署日志');
    console.log('2. 环境变量配置');
    console.log('3. MongoDB 连接状态');
  }
}

runTests().catch(console.error);

