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
                'Content-Type': 'application/json',
                // 携带本地 token（兼容多种后端读取方式）
                ...(wx.getStorageSync('token') ? {
                    'Authorization': `Bearer ${wx.getStorageSync('token')}`,
                    'token': wx.getStorageSync('token'),
                    'X-Token': wx.getStorageSync('token')
                } : {})
            },
            success: (res) => {
                if (res.statusCode === 200) {
                    resolve(res.data);
                } else {
                    const serverMsg = (res.data && (res.data.message || res.data.msg || res.data.error)) || '';
                    const errMsg = serverMsg || `请求失败，状态码: ${res.statusCode}`;
                    reject(new Error(errMsg));
                }
            },
            fail: (err) => {
                const errMsg = err && (err.errMsg || err.message) ? (err.errMsg || err.message) : '网络异常，请稍后重试';
                reject(new Error(errMsg));
            }
        });
    });
}
// 定义具体的API请求方法
const api = {
    // 获取用户信息
    login: (code) => request('/api/wechat/login','POST',{}, { code }),
    getUserInfo: (token) => request('/api/user/token','POST',{}, { token }),
    // 提交表单数据
    submitForm: (formData) => request('/form/submit', 'POST', formData)
};
export default api;