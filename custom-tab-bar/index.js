Component({
  data: {
    selected: 0,
    color: "#666666",
    selectedColor: "#07C160",
    list: []
  },
  
  lifetimes: {
    attached() {
      this.updateTabBar();
    }
  },

  methods: {
    updateTabBar() {
      const userInfo = wx.getStorageSync('userInfo') || {};
      const isHouseholder = userInfo.isHouseholder || false;
      
      // 基础 tab 列表（不含"宝宝"）
      const tabList = [
        {
          pagePath: "/pages/moment/moment",
          text: "时光",
          iconPath: "/assets/default.png",
          selectedIconPath: "/assets/default.png"
        },
        {
          pagePath: "/pages/apps/apps",
          text: "应用",
          iconPath: "/assets/default.png",
          selectedIconPath: "/assets/default.png"
        },
        {
          pagePath: "/pages/mine/mine",
          text: "我的",
          iconPath: "/assets/default.png",
          selectedIconPath: "/assets/default.png"
        }
      ];

      // 如果是管理员，在第一个位置添加"宝宝" tab
      if (isHouseholder) {
        tabList.unshift({
          pagePath: "/pages/baby/baby",
          text: "宝宝",
          iconPath: "/assets/default.png",
          selectedIconPath: "/assets/default.png"
        });
      }

      this.setData({
        list: tabList
      });
    },

    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      wx.switchTab({ url });
    }
  }
});

