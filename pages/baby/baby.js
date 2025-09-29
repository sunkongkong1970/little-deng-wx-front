import api from '../../api.js';

Page({
  data: {
    hasBaby: true,
    textColor: '#ffffff',
    authVisible: false,
    loading: false,
    hasUserInfo: false,
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    errorMsg: ''
  },

  async onLoad() {
    this.setData({
      errorMsg: ''
    });
    try {
      const token = wx.getStorageSync('token');
      if (token) {
        const res = await api.getUserInfo(token);
        console.log(res)
        if (!res) {
          throw new Error(res?.message || '获取用户信息失败');
        }
        // 用户已登录，不需要显示登录弹窗
      } else {
        // 用户未登录，显示登录弹窗
        this.setData({
          authVisible: true
        });
      }
    } catch (e) {
      console.error('登录检查失败:', e);
      this.setData({
        authVisible: true
      });
    } finally {
      this.setData({
        loading: false
      });
    }
  },

  // 关闭登录弹窗
  closeAuth() {
    this.setData({
      authVisible: false
    });
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 防止点击弹窗内容时触发mask的点击事件
  },

  onShow() {
    // 从添加宝宝页面返回时，可以在这里刷新数据
    // 实际项目中可能需要从缓存或服务器获取最新状态
  },

  //点击授权按钮后触发的回调
  onGetUserProfile(e) {
    wx.getUserProfile({
      desc: '展示用户信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
        console.log(res.userInfo)
        const userInfo = res.userInfo;
        // 2. 授权成功：提取用户信息并更新页面数据
        this.setData({
          userNickname: userInfo.nickName, // 昵称
          avatarUrl: userInfo.avatarUrl
        });
        // 3. 缓存用户基础信息
        wx.setStorageSync('nickname', userInfo.nickName || '');
        wx.setStorageSync('avatarUrl', userInfo.avatarUrl || '');
        // 完成后继续登录流程
        this.serverLogin();
      },
      fail: (err) => {
        // 接口调用失败的逻辑（如网络错误、权限问题）
        wx.showToast({
          title: '未授权，无法获取昵称和头像',
          icon: 'none',
          duration: 1500
        });
      },
    })
  },

  async serverLogin() {
    if (this.data.loading) return;
    this.setData({
      loading: true
    });
    try {
      // 1. 获取登录凭证code
      const {
        code
      } = await wx.login();
      if (!code) {
        throw new Error('获取code失败');
      }
      // 2. 登录换取 token
      const loginData = await api.userLogin(code);
      const token = loginData && loginData.token;
      console.log("000   "+token)
      if (!token) {
        throw new Error('登录失败');
      }
      // 3. 存储token
      wx.setStorageSync('token', token);
      // 4. 获取用户信息
      const userRes = await api.getUserInfo(token);
      let user;
      if (userRes && typeof userRes.code !== 'undefined') {
        if (userRes.code !== 0) {
          wx.showToast({
            title: userRes.message || '获取用户信息失败',
            icon: 'none'
          });
          return;
        }
        user = userRes.data;
      } else {
        user = userRes;
      }
      if (!user) {
        throw new Error('获取用户信息失败');
      }

      wx.showToast({
        title: '登录成功'
      });
      this.setData({
        authVisible: false
      });

    } catch (err) {
      console.error('登录失败:', err);
      wx.showToast({
        title: err.message || '登录失败',
        icon: 'none'
      });
    } finally {
      this.setData({
        loading: false
      });
    }
  },

  onAddBaby() {
    wx.navigateTo({
      url: '/pages/babyAdd/babyAdd'
    })
  },

  onEdit() {
    wx.navigateTo({
      url: '/pages/babyAdd/babyAdd?mode=edit'
    })
  },

  // 根据图片右上角颜色自动调整文字颜色
  onImageLoad(e) {
    // 创建canvas上下文用于获取图片像素信息
    const query = wx.createSelectorQuery()
    query.select('#color-detector')
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        
        // 创建image对象
        const img = canvas.createImage()
        img.src = '/assets/sample-baby.jpg'
        
        img.onload = () => {
          // 设置canvas尺寸
          canvas.width = 100
          canvas.height = 100
          
          // 绘制图片
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          
          // 获取右上角区域的像素数据（10x10区域）
          const imageData = ctx.getImageData(90, 0, 10, 10)
          const data = imageData.data
          
          // 计算平均颜色
          let r = 0, g = 0, b = 0
          for (let i = 0; i < data.length; i += 4) {
            r += data[i]
            g += data[i + 1]
            b += data[i + 2]
          }
          
          const pixelCount = data.length / 4
          r = Math.round(r / pixelCount)
          g = Math.round(g / pixelCount)
          b = Math.round(b / pixelCount)
          
          // 计算颜色亮度（YIQ公式）
          const brightness = (r * 299 + g * 587 + b * 114) / 1000
          
          // 根据亮度设置文字颜色
          // 如果图片右上角较暗，则文字为白色；如果较亮，则文字为黑色
          this.setData({
            textColor: brightness > 128 ? '#000000' : '#ffffff'
          })
        }
      })
  }
});
