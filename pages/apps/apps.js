Page({
	onShow() {
		// 更新自定义 tabBar
		this.updateTabBar();
	},

	/**
	 * 更新自定义 tabBar
	 */
	updateTabBar() {
		if (typeof this.getTabBar === 'function' && this.getTabBar()) {
			const userInfo = wx.getStorageSync('userInfo') || {};
			const isHouseholder = userInfo.isHouseholder || false;
			
			// 根据是否是管理员计算当前页面的索引
			// 如果是管理员："宝宝"=0, "时光"=1, "应用"=2, "我的"=3
			// 如果不是管理员："时光"=0, "应用"=1, "我的"=2
			const selected = isHouseholder ? 2 : 1;
			
			this.getTabBar().setData({
				selected: selected
			});
			this.getTabBar().updateTabBar();
		}
	},

	goGrowth(){ wx.navigateTo({ url:'/pages/growth/growth' }); },
	goVaccine(){ wx.navigateTo({ url:'/pages/vaccine/vaccine' }); }
});
