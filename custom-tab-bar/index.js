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

      const tabList = [
        {
          pagePath: "/pages/moment/moment",
          text: "时光",
          iconPath: "/assets/mo0.png",
          selectedIconPath: "/assets/mo1.png"
        },
        {
          pagePath: "/pages/apps/apps",
          text: "应用",
          iconPath: "/assets/app0.png",
          selectedIconPath: "/assets/app1.png"
        },
        {
          pagePath: "/pages/mine/mine",
          text: "我的",
          iconPath: "/assets/my0.png",
          selectedIconPath: "/assets/my1.png"
        }
      ];

      if (isHouseholder) {
        tabList.unshift({
          pagePath: "/pages/baby/baby",
          text: "宝宝",
          iconPath: "/assets/bb0.png",
          selectedIconPath: "/assets/bb1.png"
        });
      }

      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const currentPath = currentPage ? `/${currentPage.route}` : '';
      const selectedIndex = tabList.findIndex(item => item.pagePath === currentPath);

      this.setData({
        list: tabList,
        selected: selectedIndex >= 0 ? selectedIndex : 0
      });
    },

    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      wx.switchTab({ url });
    }
  }
});

