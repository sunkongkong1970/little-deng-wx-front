import api from '../../api.js';

Page({
  data: {
    hasBaby: true,
    textColor: '#ffffff',
    errorMsg: '',
    babyList: [], // 宝宝列表
    isAdmin: false // 是否为管理员（户主）
  },

  async onLoad(options) {
    this.setData({
      errorMsg: ''
    });
    
    try {
      const token = wx.getStorageSync('token');
      if (!token) {
        // 未登录，跳转到moment页面（主页）
        wx.reLaunch({
          url: '/pages/moment/moment'
        });
        return;
      }
      
      // 检查用户角色，判断是否为户主（管理员）
      const userInfo = wx.getStorageSync('userInfo') || {};
      const isAdmin = userInfo.isHouseholder === true; // true为户主
      this.setData({
        isAdmin: isAdmin
      });
      
      // 加载宝宝列表
      await this.loadBabyList();
    } catch (e) {
      console.error('加载失败:', e);
      // 出错时跳转到moment页面
      wx.reLaunch({
        url: '/pages/moment/moment'
      });
    }
  },

  // 加载宝宝列表
  async loadBabyList() {
    try {
      // 从缓存获取用户信息
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo.homeId) {
        console.log('未找到用户homeId');
        wx.reLaunch({
          url: '/pages/familySelect/familySelect'
        });
        return;
      }

      // 调用接口获取宝宝列表
      const babyList = await api.getBabyList(userInfo.homeId);
    
      this.setData({
        babyList: babyList || [],
        hasBaby: babyList && babyList.length > 0
      });
    } catch (error) {
      console.error('加载宝宝列表失败:', error);
      wx.showToast({
        title: '加载宝宝列表失败',
        icon: 'none'
      });
    }
  },

  // 点击宝宝卡片，跳转到详情页
  onBabyCardTap(e) {
    console.log(111)
    const {
      childId
    } = e.currentTarget.dataset;
    console.log(e.currentTarget)
    if (childId) {
      wx.navigateTo({
        url: `/pages/babyDetail/babyDetail?id=${childId}`
      });
    }
  },

  async onShow() {
    // 更新自定义 tabBar
    this.updateTabBar();
    
    // 从添加宝宝页面返回时，刷新宝宝列表
    const token = wx.getStorageSync('token');
    if (token) {
      await this.loadBabyList();
    }
  },

  /**
   * 更新自定义 tabBar
   */
  updateTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0  // "宝宝"页面在管理员视图中的索引为 0
      });
      this.getTabBar().updateTabBar();
    }
  },

  onAddBaby() {
    const token = wx.getStorageSync('token');
    if (token) {
      wx.navigateTo({
        url: '/pages/babyAdd/babyAdd'
      })
    } else {
      this.setData({
        authVisible: true
      });
    }

  },

  onEdit() {
    wx.navigateTo({
      url: '/pages/babyAdd/babyAdd?mode=edit'
    })
  },

  // 根据图片右上角颜色自动调整文字颜色
  onImageLoad(e) {
    // 创建canvas上下文用于获取图片像素信息
    const query = wx.createSelectorQuery().in(this)
    query.select('#color-detector')
      .fields({
        node: true,
        size: true
      })
      .exec((res) => {
        // 添加错误处理
        if (!res || !res[0] || !res[0].node) {
          console.warn('Canvas 元素未找到，跳过颜色检测');
          return;
        }
        
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')

        // 创建image对象
        const img = canvas.createImage()
        img.src = '/assets/baby.png'

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
          let r = 0,
            g = 0,
            b = 0
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