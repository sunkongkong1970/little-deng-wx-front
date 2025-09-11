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

      const res = await api.login(code);

      if (!res || res.code !== 0 || !res.data) {
        this.setData({
          authVisible: false
        });
        throw new Error(res?.message || '登录失败');
      }

      // 3. 存储token
      const {
        token
      } = res.data;
      wx.setStorageSync('token', token);
      // 4. 获取用户信息并按家庭状态跳转
      const userRes = await api.getUserInfo(token);
      if (!userRes || userRes.code !== 0 || !userRes.data) {
        throw new Error(userRes?.message || '获取用户信息失败');
      }
      const user = userRes.data;
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