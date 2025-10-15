Page({
	data: {
		userNickname: '我的昵称',
		userAvatar: '/assets/default.png',
		coverImage: 'https://via.placeholder.com/750x400/667eea/ffffff?text=My+Timeline',
		posts: [
			{
				id: 1,
				nick: '小暖妈妈',
				text: '今天第一次翻身啦！宝宝真棒，妈妈好开心～看着宝宝一天天成长，每一个瞬间都值得记录💕',
				time: '2小时前',
				loc: '人民公园',
				liked: false,
				likeCount: 5,
				images: [
					'https://via.placeholder.com/400x400/ffb6c1/ffffff?text=Baby+1',
					'https://via.placeholder.com/400x400/98d8c8/ffffff?text=Baby+2',
					'https://via.placeholder.com/400x400/f7dc6f/ffffff?text=Baby+3'
				]
			},
			{
				id: 2,
				nick: '小暖爸爸',
				text: '午睡香甜～睡得真好，期待下午醒来一起玩耍',
				time: '5小时前',
				liked: true,
				likeCount: 8,
				images: [
					'https://via.placeholder.com/400x400/c8e6c9/ffffff?text=Sleep'
				]
			},
			{
				id: 3,
				nick: '小暖奶奶',
				text: '带宝宝去公园玩，天气真好，宝宝玩得很开心！',
				time: '1天前',
				loc: '世纪公园',
				liked: false,
				likeCount: 12,
				images: []
			},
			{
				id: 4,
				nick: '小暖妈妈',
				text: '第一次尝试辅食，宝宝吃得津津有味😊',
				time: '3天前',
				liked: false,
				likeCount: 15,
				images: [
					'https://via.placeholder.com/400x400/ffe5b4/ffffff?text=Food+1',
					'https://via.placeholder.com/400x400/ffd4a3/ffffff?text=Food+2'
				]
			}
		]
	},

	onLoad() {
		// 页面加载时初始化
		this.loadUserInfo();
	},

	onShow() {
		// 页面显示时可以刷新数据
	},

	/**
	 * 下拉刷新
	 */
	onPullDownRefresh() {
		// 模拟刷新数据
		setTimeout(() => {
			wx.showToast({
				title: '刷新成功',
				icon: 'success'
			});
			wx.stopPullDownRefresh();
		}, 1000);
	},

	/**
	 * 加载用户信息
	 */
	loadUserInfo() {
		// 从缓存获取用户信息
		const userInfo = wx.getStorageSync('userInfo');
		const nickname = wx.getStorageSync('nickname');
		const avatarUrl = wx.getStorageSync('avatarUrl');
		
		if (userInfo && userInfo.userName) {
			this.setData({
				userNickname: userInfo.userName
			});
		} else if (nickname) {
			this.setData({
				userNickname: nickname
			});
		}

		if (avatarUrl) {
			this.setData({
				userAvatar: avatarUrl
			});
		}
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

		// 显示点赞动画提示
		wx.showToast({
			title: post.liked ? '已点赞' : '已取消',
			icon: 'none',
			duration: 800
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
			path: '/pages/moment/moment',
			imageUrl: this.data.coverImage
		};
	}
});
