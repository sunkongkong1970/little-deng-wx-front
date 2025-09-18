import api from '../../api.js';
Page({
  data: {
    authVisible: false,
    loading: false,
    hasUserInfo: false,
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
  },
  async onLoad() {
    this.setData({
      errorMsg: ''
    });
    try {
      const token = wx.getStorageSync('token');
      if (token) {
        const res = await api.getUserInfo(token);
        if (!res || res.code !== 0 || !res.data) {
          throw new Error(res?.message || '获取用户信息失败');
        }
        const user = res.data;

        if (user.homeId) {
          wx.reLaunch({
            url: '/pages/baby/baby'
          });
        } else {
          wx.reLaunch({
            url: '/pages/familySelect/familySelect'
          });
        }
      }
    } catch (e) {

    } finally {
      this.setData({
        loading: false
      });
    }
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
          avatarUrl:userInfo.avatarUrl
        });
        // 3. 缓存用户基础信息
        wx.setStorageSync('nickname', userInfo.nickName || '');
        wx.setStorageSync('avatarUrl', userInfo.avatarUrl || '');
      // 完成后关闭对话框并继续登录流程
      this.setData({ authVisible: false });
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
      if (!token) {
        this.setData({
          authVisible: false
        });
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
          this.setData({
            authVisible: false
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
      if (user.homeId) {
        wx.reLaunch({
          url: '/pages/baby/baby'
        });
      } else {
        wx.reLaunch({
          url: '/pages/familySelect/familySelect'
        });
      }

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
  }
});