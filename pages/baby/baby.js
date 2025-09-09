Page({
	data:{ hasBaby:false },
	onAddBaby(){
		this.setData({ hasBaby:true });
	},
	onEdit(){
		wx.navigateTo({ url:'/pages/babyEdit/babyEdit' });
	}
});
