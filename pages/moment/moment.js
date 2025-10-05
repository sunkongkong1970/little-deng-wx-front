Page({
	data: {
		userNickname: '我的昵称',
		userAvatar: '',
		coverImage: 'https://via.placeholder.com/750x400/4A90E2/ffffff?text=Cover',
		posts: [
			{
				id: 1,
				nick: '小暖妈妈',
				text: '今天第一次翻身啦！宝宝真棒，妈妈好开心～',
				time: '2小时前',
				loc: '人民公园',
				liked: false,
				likeCount: 5,
				images: []
			},
			{
				id: 2,
				nick: '小暖爸爸',
				text: '午睡香甜～睡得真好，期待下午醒来一起玩耍',
				time: '5小时前',
				liked: false,
				likeCount: 3,
				images: []
			}
		]
	},

	onLoad() {
		// 页面加载时的初始化逻辑
		// 设置右上角按钮
		wx.setNavigationBarColor({
			frontColor: '#ffffff',
			backgroundColor: '#393A3F'
		});
	},

	onShow() {
		// 页面显示时可以刷新数据
	},

	/**
	 * 跳转到发布页面
	 */
	goToPublish() {
		wx.navigateTo({
			url: '/pages/momentPublish/momentPublish'
		});
	},

	/**
	 * 预览图片
	 */
	previewImage(e) {
		const urls = e.currentTarget.dataset.urls;
		const current = e.currentTarget.dataset.current;
		wx.previewImage({
			urls: urls,
			current: current
		});
	},

	/**
	 * 点赞/取消点赞
	 */
	onLike(e) {
		const index = e.currentTarget.dataset.index;
		const posts = this.data.posts;
		const post = posts[index];

		post.liked = !post.liked;
		post.likeCount = post.liked ? post.likeCount + 1 : post.likeCount - 1;

		this.setData({
			posts: posts
		});
	},

	/**
	 * 评论
	 */
	onComment(e) {
		const index = e.currentTarget.dataset.index;
		const post = this.data.posts[index];

		wx.showToast({
			title: '评论功能开发中',
			icon: 'none'
		});
	},

	/**
	 * 页面右上角菜单按钮点击事件
	 */
	onShareAppMessage() {
		return {
			title: '分享宝宝的美好时光',
			path: '/pages/moment/moment'
		};
	}
});
