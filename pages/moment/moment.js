import api from '../../api.js';

Page({
	data: {
		userNickname: '我的昵称',
		userAvatar: '/assets/default.png',
		coverImage: '', // 封面图片（裁剪后）
		coverImageOriginal: '', // 封面原图（用于预览）
		posts: [],
		pageNum: 1,
		pageSize: 10,
		hasMore: true,
		loading: false,
		babyImages: [], // 存储baby裁剪照片列表
		babyOriginalImages: [] // 存储baby原图列表
	},

	onLoad() {
		// 页面加载时初始化
		this.loadUserInfo();
		this.loadBabyImages();
		this.loadPhotoWallList(true);
	},

	onShow() {
		// 页面显示时可以刷新数据
		this.loadBabyImages();
	},

	/**
	 * 下拉刷新
	 */
	onPullDownRefresh() {
		this.setData({
			pageNum: 1,
			posts: [],
			hasMore: true
		});
		this.loadPhotoWallList(true).then(() => {
			wx.stopPullDownRefresh();
			wx.showToast({
				title: '刷新成功',
				icon: 'success',
				duration: 1000
			});
		}).catch(() => {
			wx.stopPullDownRefresh();
		});
	},

	/**
	 * 上拉加载更多
	 */
	onReachBottom() {
		if (!this.data.hasMore || this.data.loading) {
			return;
		}
		this.loadPhotoWallList(false);
	},

	/**
	 * 加载用户信息
	 */
	async loadUserInfo() {
		try {
			// 从缓存获取用户信息
			const userInfo = wx.getStorageSync('userInfo');
			const nickname = wx.getStorageSync('nickname');
			const avatarUrl = wx.getStorageSync('avatarUrl');
			const token = wx.getStorageSync('token');
			
			console.log('加载用户信息 - userInfo:', userInfo);
			console.log('加载用户信息 - nickname:', nickname);
			console.log('加载用户信息 - avatarUrl:', avatarUrl);
			
			// 设置昵称
			if (userInfo && userInfo.userName) {
				this.setData({
					userNickname: userInfo.userName
				});
			} else if (nickname) {
				this.setData({
					userNickname: nickname
				});
			}

			// 如果有token，重新从服务器获取最新的用户信息（包括头像）
			if (token) {
				try {
					const latestUserInfo = await api.getUserInfo(token);
					console.log('从服务器获取的最新用户信息:', latestUserInfo);
					
					// 更新缓存
					if (latestUserInfo) {
						wx.setStorageSync('userInfo', latestUserInfo);
						
						// 使用数据库中的头像URL（用户上传的真实头像）
						if (latestUserInfo.userAvatarUrl) {
							console.log('使用数据库中的真实头像:', latestUserInfo.userAvatarUrl);
							this.setData({
								userAvatar: latestUserInfo.userAvatarUrl
							});
							return;
						}
					}
				} catch (error) {
					console.error('获取最新用户信息失败:', error);
				}
			}

			// 降级方案：使用缓存中的头像
			if (userInfo && userInfo.userAvatarUrl) {
				console.log('使用缓存中的 userInfo.userAvatarUrl:', userInfo.userAvatarUrl);
				this.setData({
					userAvatar: userInfo.userAvatarUrl
				});
			} else {
				console.log('使用默认头像');
				this.setData({
					userAvatar: '/assets/default.png'
				});
			}
		} catch (error) {
			console.error('加载用户信息失败:', error);
			this.setData({
				userAvatar: '/assets/default.png'
			});
		}
	},

	/**
	 * 加载baby照片列表（用于头部随机显示）
	 */
	async loadBabyImages() {
		try {
			const userInfo = wx.getStorageSync('userInfo');
			if (!userInfo || !userInfo.homeId) {
				return;
			}

			const babyList = await api.getBabyList(userInfo.homeId);
			if (babyList && babyList.length > 0) {
				console.log('宝宝列表:', babyList);
				
				// 创建照片对象数组，保持裁剪图和原图的对应关系
				const imageList = babyList
					.filter(baby => baby.childCoverCroppedImg || baby.childCoverImg)
					.map(baby => ({
						cropped: baby.childCoverCroppedImg || baby.childCoverImg, // 裁剪后的图片
						original: baby.childCoverImg || baby.childCoverCroppedImg // 原图
					}));
				
				if (imageList.length > 0) {
					// 随机选择一张照片作为封面
					const randomIndex = Math.floor(Math.random() * imageList.length);
					const selectedImage = imageList[randomIndex];
					
					this.setData({
						babyImages: imageList.map(img => img.cropped),
						babyOriginalImages: imageList.map(img => img.original),
						coverImage: selectedImage.cropped,
						coverImageOriginal: selectedImage.original
					});
				}
			}
		} catch (error) {
			console.error('加载baby照片失败:', error);
		}
	},

	/**
	 * 加载照片墙列表
	 * @param {Boolean} refresh 是否是刷新操作
	 */
	async loadPhotoWallList(refresh = false) {
		if (this.data.loading) {
			return;
		}

		try {
			this.setData({ loading: true });

			const token = wx.getStorageSync('token');
			if (!token) {
				wx.showToast({
					title: '请先登录',
					icon: 'none'
				});
				return;
			}

			const pageNum = refresh ? 1 : this.data.pageNum;
			const result = await api.getPhotoWallList(token, pageNum, this.data.pageSize);

			console.log('照片墙API返回数据:', result);

			if (result && result.list) {
				console.log('照片墙列表数据:', result.list);
				console.log('照片墙数据数量:', result.list.length);
				
				// 测试第一张图片URL
				if (result.list.length > 0 && result.list[0].images && result.list[0].images.length > 0) {
					console.log('测试图片URL:', result.list[0].images[0]);
					console.log('复制此URL到浏览器测试能否打开');
				}
				
				// 转换数据格式
				const formattedPosts = result.list.map((item, index) => {
					console.log(`\n===== 第${index + 1}条照片墙数据 =====`);
					console.log('完整数据:', item);
					console.log('ID:', item.id);
					console.log('创建者角色:', item.createUserRoleName);
					console.log('创建者头像URL:', item.createUserAvatar);
					console.log('图片列表:', item.images);
					console.log('图片数量:', item.images ? item.images.length : 0);
					
					const post = {
						id: item.id,
						nick: item.createUserRoleName || '家庭成员',
						avatar: item.createUserAvatar && item.createUserAvatar.trim() !== '' 
							? item.createUserAvatar 
							: '/assets/default.png',
						text: item.content || '',
						time: this.formatTime(item.postTime || item.createTime),
						loc: item.location || '',
						liked: item.liked || false,
						likeCount: item.likeCount || 0,
						images: Array.isArray(item.images) ? item.images : []
					};
					
					console.log('转换后的数据:', post);
					console.log('转换后的头像:', post.avatar);
					console.log('转换后的图片:', post.images);
					console.log('========================\n');
					
					return post;
				});

				const posts = refresh ? formattedPosts : [...this.data.posts, ...formattedPosts];

				this.setData({
					posts: posts,
					pageNum: pageNum + 1,
					hasMore: result.hasMore || false
				});

				// 预加载下一页（如果还有更多数据）
				if (result.hasMore && !refresh) {
					setTimeout(() => {
						this.preloadNextPage();
					}, 500);
				}
			}
		} catch (error) {
			console.error('加载照片墙列表失败:', error);
			wx.showToast({
				title: error.message || '加载失败',
				icon: 'none'
			});
		} finally {
			this.setData({ loading: false });
		}
	},

	/**
	 * 预加载下一页数据
	 */
	async preloadNextPage() {
		if (!this.data.hasMore || this.data.loading) {
			return;
		}

		try {
			const token = wx.getStorageSync('token');
			if (!token) return;

			// 静默加载下一页
			const result = await api.getPhotoWallList(token, this.data.pageNum, this.data.pageSize);
			
			if (result && result.list && result.list.length > 0) {
				// 预加载的数据暂存，不显示
				console.log('预加载下一页数据成功，共', result.list.length, '条');
			}
		} catch (error) {
			console.error('预加载失败:', error);
		}
	},

	/**
	 * 格式化时间
	 */
	formatTime(dateTimeStr) {
		if (!dateTimeStr) return '';

		const date = new Date(dateTimeStr);
		const now = new Date();
		const diff = now - date;

		const minute = 60 * 1000;
		const hour = 60 * minute;
		const day = 24 * hour;

		if (diff < minute) {
			return '刚刚';
		} else if (diff < hour) {
			return Math.floor(diff / minute) + '分钟前';
		} else if (diff < day) {
			return Math.floor(diff / hour) + '小时前';
		} else if (diff < 7 * day) {
			return Math.floor(diff / day) + '天前';
		} else {
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const dayStr = String(date.getDate()).padStart(2, '0');
			return `${year}-${month}-${dayStr}`;
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
	 * 预览封面原图
	 */
	previewCoverImage() {
		if (this.data.coverImageOriginal) {
			wx.previewImage({
				urls: [this.data.coverImageOriginal],
				current: this.data.coverImageOriginal
			});
		}
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
	 * 头像加载成功
	 */
	onAvatarLoad(e) {
		console.log('头像加载成功:', e);
	},

	/**
	 * 头像加载失败
	 */
	onAvatarError(e) {
		console.error('头像加载失败:', e);
		console.error('失败的图片URL:', this.data.userAvatar);
		// 加载失败时使用默认头像
		this.setData({
			userAvatar: '/assets/default.png'
		});
	},

	/**
	 * 点赞/取消点赞
	 */
	async onLike(e) {
		const index = e.currentTarget.dataset.index;
		const posts = this.data.posts;
		const post = posts[index];

		try {
			const token = wx.getStorageSync('token');
			if (!token) {
				wx.showToast({
					title: '请先登录',
					icon: 'none'
				});
				return;
			}

			// 先更新UI，提升体验
			const originalLiked = post.liked;
			const originalCount = post.likeCount;
			
			post.liked = !post.liked;
			post.likeCount = post.liked ? post.likeCount + 1 : post.likeCount - 1;
			
			this.setData({
				posts: posts
			});

			// 调用API
			const result = await api.togglePhotoWallLike(token, post.id);

			// 显示点赞动画提示
			wx.showToast({
				title: result ? '已点赞' : '已取消',
				icon: 'none',
				duration: 800
			});

			// 确保UI状态与服务器返回一致
			post.liked = result;
			this.setData({
				posts: posts
			});

		} catch (error) {
			console.error('点赞操作失败:', error);
			// 恢复原状态
			post.liked = !post.liked;
			post.likeCount = post.liked ? post.likeCount + 1 : post.likeCount - 1;
			this.setData({
				posts: posts
			});
			
			wx.showToast({
				title: '操作失败，请重试',
				icon: 'none'
			});
		}
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
