Page({
	data:{ nick:'', role:'', canSave:false },
	onNickChange(e){
		const nick = e.detail.value || '';
		this.setData({ nick, canSave: !!nick && !!this.data.role });
	},
	onRoleChange(e){
		const role = e.detail.value;
		this.setData({ role, canSave: !!this.data.nick && !!role });
	},
	onSave(){
		wx.switchTab({ url:'/pages/baby/baby' });
	}
});
