const envConfig = {
  development: {
      apiBaseUrl: 'http://127.0.0.1:8080/little-deng-server'
  },
  production: {
      apiBaseUrl: 'https://prod-api.example.com'
  }
};
// 手动指定当前环境，可根据实际情况修改
const currentEnv = 'development';
export default envConfig[currentEnv];