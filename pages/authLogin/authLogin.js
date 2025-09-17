import api from '../../api.js';
Page({
  data: {
    authVisible: false,
    loading: false,
  },
  async onLoad() {
    this.setData({ errorMsg: '' });
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
  onAuthorize() {
    this.setData({
      authVisible: true
    });
  },
  async onConfirm() {
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
        this.setData({ authVisible: false });
        throw new Error('登录失败');
      }
      // 3. 存储token
      wx.setStorageSync('token', token);
      // 4. 获取用户信息
      const userRes = await api.getUserInfo(token);
      let user;
      if (userRes && typeof userRes.code !== 'undefined') {
        if (userRes.code !== 0) {
          wx.showToast({ title: userRes.message || '获取用户信息失败', icon: 'none' });
          this.setData({ authVisible: false });
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
  },
  onCancel() {
    this.setData({
      authVisible: false
    });
    const toast = this.selectComponent('#toast');
    toast?.show?.({
      theme: 'error',
      message: '请授权以继续使用小程序'
    });
  }
});