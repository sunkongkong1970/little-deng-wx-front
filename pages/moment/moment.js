Page({
	data:{ content:'', canPost:false, posts:[
		{ nick:'小暖妈妈', text:'今天第一次翻身啦！', time:'2025-09-08 10:20', loc:'人民公园' },
		{ nick:'小暖爸爸', text:'午睡香甜～', time:'2025-09-08 09:00' }
	]},
	onContentChange(e){
		const content = e.detail.value || '';
		this.setData({ content, canPost: content.length>0 });
	},
	onPost(){
		const arr = this.data.posts.slice();
		arr.unshift({ nick:'我', text:this.data.content, time:'刚刚' });
		this.setData({ posts:arr, content:'', canPost:false });
	},
	noop(){}
});
