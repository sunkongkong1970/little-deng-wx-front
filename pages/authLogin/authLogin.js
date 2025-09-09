Page({
	data: { authVisible:false },
	onAuthorize() {
		this.setData({ authVisible:true });
	},
	onConfirm() {
		this.setData({ authVisible:false });
		wx.navigateTo({ url: '/pages/familySelect/familySelect' });
	},
	onCancel() {
		this.setData({ authVisible:false });
		const toast = this.selectComponent('#toast');
		toast?.show?.({ theme: 'error', message: '请授权以继续使用小程序' });
	}
});
