Page({
	data:{ code:'', canJoin:false },
	onCodeChange(e){
		const value = e.detail.value || '';
		this.setData({ code:value, canJoin: value.length >= 6 });
	},
	onJoin(){
		wx.navigateTo({ url:'/pages/roleSetting/roleSetting' });
	},
	onAdd(){
		wx.navigateTo({ url:'/pages/roleSetting/roleSetting' });
	}
});
