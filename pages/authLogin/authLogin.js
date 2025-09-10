import api from '../../api.js';
Page({
  data: {
    authVisible: false,
    loading: false
  },
  onAuthorize() {
    this.setData({
      authVisible: true
    });
  },
  async onConfirm() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      // 1. 获取登录凭证code
      const { code } = await wx.login();
      if (!code) {
        throw new Error('获取code失败');
      }
      // 2. 调用后端接口获取token
      // const res = await wx.request({
      //   url: '127.0.0.1:8080/little-deng-service/api/wechat/login',
      //   method: 'POST',
      //   data: { code }
      // });
      const res = await api.login(code);

      if (!res || res.code !== 0 || !res.data) {
        this.setData({
          authVisible: false
        });
        throw new Error(res?.message || '登录失败');
      }

      // 3. 存储token和用户信息
      const { token, userId } = res.data;
      wx.setStorageSync('token', token);
      wx.setStorageSync('userId', userId);
      
      // 4. 登录成功，跳转到首页
      wx.showToast({ title: '登录成功' });
      this.setData({
        authVisible: false
      });
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/familySelect/familySelect'
        });
      }, 300);
      
    } catch (err) {
      console.error('登录失败:', err);
      wx.showToast({ 
        title: err.message || '登录失败', 
        icon: 'none' 
      });
    } finally {
      this.setData({ loading: false });
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