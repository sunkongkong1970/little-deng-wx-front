Page({
	onSave(){
		const toast = this.selectComponent('#toast');
		toast?.show?.({ message:'已保存到相册（模拟）' });
	}
});
