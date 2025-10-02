import config from './env.js';
// 封装通用的请求方法
function request(url, method = 'GET', data = {}, params = {}) {
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
        console.log(res)
        if (res.statusCode === 200) {
          const body = res.data;
          if (body && typeof body === 'object' && Object.prototype.hasOwnProperty.call(body, 'code')) {
            if (body.code === 0) {
              // 业务成功：优先返回 data，否则返回整个 body
              resolve(typeof body.data === 'undefined' ? body : body.data);
            } else {
              const message = (body && (body.message || body.msg || body.error)) || '业务异常';
              const error = new Error(`[${body.code}] ${message}`);
              error.code = body.code;
              error.response = body;
              reject(error);
            }
          } else {
            // 未按约定返回 code 字段，则原样返回
            resolve(body);
          }
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
  // 登录
  userLogin: (code) => request('/api/wechat/login', 'POST', {}, {
    code
  }),
  // 获取用户信息
  getUserInfo: (token) => request('/api/user/token', 'POST', {}, {
    token
  }),
  // 获取用户头像
  getUserAvatar: (token) => request('/api/user/avatar', 'POST', {}, {
    token
  }),
  //编辑用户
  editUser: (token, userName, userRole, userAvatarBase64 = '') => request('/api/user/edit', 'POST', {
    token,
    userName,
    userRole,
    userAvatarBase64
  }, {}),
  // 加入家庭
  joinHome: (token, homeCode) => request('/api/', 'POST', {}, {
    token,
    homeCode
  }),
  // 创建家庭
  createHome: (token, userRole, userName, homeName, avatarBase64 = '') => request('/api/home/createHome', 'POST', {
    token,
    userRole,
    userName,
    homeName,
    avatarBase64
  }, {}),
  // 角色选项（下拉框）
  getRoleOptions: (type) => request('/api/dict/dictList', 'GET', {
    type
  }),

  //添加宝宝
  editBaby: (token, babyInfo) => request('/api/child/edit', 'POST', {
    token,
    babyInfo
  }, {}),

  //查询宝宝列表
  getBabyList: (homeId) => request('/api/child/getList', 'GET', {}, {
    homeId
  }),

  //查询宝宝详情
  getBaby: (id) => request('/api/child/getById', 'GET', {}, {
    id
  }),

   //获取邀请码
   generateCode: (token) => request('/api/home/generateCode', 'GET', {}, {
    token
  }),

  // 上传图片文件（通过wx.uploadFile）
  uploadImageFile: (token, typeEnum, filePath) => {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: config.apiBaseUrl + '/api/image/upload',
        filePath: filePath,
        name: 'image',
        formData: {
          token: token,
          typeEnum: typeEnum
        },
        header: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
          'X-Token': token
        },
        success: (res) => {
          try {
            const data = JSON.parse(res.data);
            if (data.code === 0 && data.data) {
              console.log('上传成功，返回的图片路径:', data.data);
              resolve(data.data);
            } else {
              reject(new Error(data.message || '上传失败'));
            }
          } catch (e) {
            reject(new Error('解析返回数据失败'));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  },

  // 更新用户资料（角色与昵称）
  userJoinHome: (token, userRole, userName, homeCode, avatarBase64 = '') => request('/api/user/joinHome', 'POST', {
    token,
    userRole,
    userName,
    homeCode,
    avatarBase64
  }, {}),

  // 提交表单数据
  submitForm: (formData) => request('/form/submit', 'POST', formData)
};
export default api;