import config from './env.js';

// 美化的错误提示
function showErrorToast(message, code) {
  const errorMessages = {
    400: '请求参数错误',
    401: '未授权，请先登录',
    403: '没有权限访问',
    404: '请求的资源不存在',
    500: '服务器内部错误',
    502: '网关错误',
    503: '服务暂时不可用',
    504: '登录已过期'
  };

  // 获取友好的错误消息
  const friendlyMessage = errorMessages[code] || message;

  wx.showModal({
    title: '温馨提示',
    content: friendlyMessage,
    showCancel: false,
    confirmText: '知道了',
    confirmColor: '#07C160',
    success: (res) => {
      if (res.confirm) {
        console.log('用户点击确定');
      }
    }
  });
}

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
            
            // 处理登录过期（504错误）
            if (body.code === 504) {
              // 清除本地token
              wx.removeStorageSync('token');
              wx.removeStorageSync('userInfo');
              
              // 跳转到moment页面（主页）并显示登录弹窗
              wx.reLaunch({
                url: '/pages/moment/moment?showAuth=true'
              });
            } else {
              // 其他错误，显示美化的提示
              showErrorToast(message, body.code);
            }
            
            reject(error);
          }
          } else {
            // 未按约定返回 code 字段，则原样返回
            resolve(body);
          }
        } else {
          const serverMsg = (res.data && (res.data.message || res.data.msg || res.data.error)) || '';
          const errMsg = serverMsg || `请求失败，状态码: ${res.statusCode}`;
          
          // 显示美化的错误提示
          showErrorToast(errMsg, res.statusCode);
          
          reject(new Error(errMsg));
        }
      },
      fail: (err) => {
        const errMsg = err && (err.errMsg || err.message) ? (err.errMsg || err.message) : '网络异常，请稍后重试';
        
        // 显示美化的网络错误提示
        wx.showModal({
          title: '网络异常',
          content: '网络连接失败，请检查网络设置后重试',
          showCancel: false,
          confirmText: '知道了',
          confirmColor: '#07C160'
        });
        
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
  editUser: (token, userName, userRole, userAvatarBase64 = '', userAvatarUrl = '') => request('/api/user/edit', 'POST', {
    token,
    userName,
    userRole,
    userAvatarBase64,
    userAvatarUrl
  }, {}),
  // 加入家庭（已废弃，请使用 userJoinHome）
  userJoinHome: (token, userRole, userName, homeCode, userAvatarBase64 = '', userAvatarUrl = '') => request('/api/user/joinHome', 'POST', {
    token,
    userRole,
    userName,
    homeCode,
    userAvatarBase64,
    userAvatarUrl
  }, {}),
  // 创建家庭
  createHome: (token, userRole, userName, homeName, userAvatarBase64 = '', userAvatarUrl = '') => request('/api/home/createHome', 'POST', {
    token,
    userRole,
    userName,
    homeName,
    userAvatarBase64,
    userAvatarUrl
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
   getHomeCode: (token) => request('/api/home/getHomeCode', 'GET', {}, {
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

  // 提交表单数据
  submitForm: (formData) => request('/form/submit', 'POST', formData),

  // ========== 照片墙相关接口 ==========
  
  // 获取照片墙列表（分页）
  getPhotoWallList: (token, pageNum = 1, pageSize = 10) => request('/api/photo-wall/list', 'GET', {}, {
    token,
    pageNum,
    pageSize
  }),

  // 创建照片墙
  createPhotoWall: (token, photoWallData) => request('/api/photo-wall/create', 'POST',{
    token,
    homeId: photoWallData.homeId,
    childIds: photoWallData.childIds,
    content: photoWallData.content,
    postTime: photoWallData.postTime,
    location: photoWallData.location,
    imgUrls: photoWallData.imgUrls
  },{}),

  // 点赞或取消点赞
  togglePhotoWallLike: (token, photoWallId) => request('/api/photo-wall/like', 'POST', {}, {
    token,
    photoWallId
  }),

  // 删除照片墙
  deletePhotoWall: (token, photoWallId) => request('/api/photo-wall/delete', 'POST', {},{
    token,
    photoWallId
  }),

  // ========== 评论相关接口 ==========
  
  // 创建评论
  createComment: (token, photoWallId, commentContent, parentId = null) => request('/api/photo-wall/comment/create', 'POST', {
    token,
    photoWallId,
    commentContent,
    parentId
  }, {}),

  // 获取评论列表
  getCommentList: (photoWallId) => request('/api/photo-wall/comment/list', 'GET', {}, {
    photoWallId
  }),

  // 删除评论
  deleteComment: (token, commentId) => request('/api/photo-wall/comment/delete', 'POST', {}, {
    token,
    commentId
  }),

  // ========== 家庭管理相关接口 ==========
  
  // 获取家庭信息
  getFamilyInfo: (token, homeId) => request('/api/home/info', 'GET', {}, {
    token,
    homeId
  }),

  // 更新家庭信息
  updateFamilyInfo: (token, homeId, homeName) => request('/api/home/update', 'POST', {}, 
  {token,
    homeId,
    homeName}),

  // 获取家庭成员列表
  getFamilyMembers: (token, homeId) => request('/api/home/members', 'GET', {}, {
    token,
    homeId
  })
};
export default api;