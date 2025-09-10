import config from './env.js';
// 封装通用的请求方法
function request(url, method = 'GET', data = {},params = {}) {
   // 处理查询参数
   const queryStr = Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`).join('&');
   const requestUrl = queryStr ? `${config.apiBaseUrl + url}?${queryStr}` : config.apiBaseUrl + url;

    return new Promise((resolve, reject) => {
        wx.request({
            url: requestUrl,
            method: method,
            data: data,
            header: {
                'Content-Type': 'application/json'
            },
            success: (res) => {
                if (res.statusCode === 200) {
                    resolve(res.data);
                } else {
                    reject(new Error(`请求失败，状态码: ${res.statusCode}`));
                }
            },
            fail: (err) => {
                reject(err);
            }
        });
    });
}
// 定义具体的API请求方法
const api = {
    // 获取用户信息
    login: (code) => request('/api/wechat/login','POST',{}, { code }),
    getUserInfo: () => request('/user/info'),
    // 提交表单数据
    submitForm: (formData) => request('/form/submit', 'POST', formData)
};
export default api;