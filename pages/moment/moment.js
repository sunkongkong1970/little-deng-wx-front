import api from '../../api.js';

Page({
	data: {
		userNickname: '我的昵称',
		userAvatar: '/assets/default.png',
		userInfo: {}, // 用户信息（用于评论权限判断）
		currentUserId: null, // 当前用户ID（用于删除权限判断）
		isHouseholder: false, // 是否是管理员（用于删除权限判断）
		coverImage: '', // 封面图片（裁剪后）
		coverImageOriginal: '', // 封面原图（用于预览）
		posts: [],
		pageNum: 1,
		pageSize: 10,
		hasMore: true,
		loading: false,
		babyImages: [], // 存储baby裁剪照片列表
		babyOriginalImages: [], // 存储baby原图列表
		authVisible: false, // 登录弹窗显示状态
		canIUseGetUserProfile: wx.canIUse('getUserProfile'),
		
		// 评论相关
		commentVisible: false, // 评论弹窗显示状态
		currentPhotoWallId: null, // 当前评论的照片墙ID
		currentPostIndex: null, // 当前评论的帖子索引
		comments: [], // 评论列表
		commentInput: '', // 评论输入内容
		replyToCommentId: null, // 回复的评论ID
		replyToUserName: '', // 回复的用户名
		inputFocus: false, // 输入框聚焦状态
		
		// 点赞动画相关
		likeAnimVisible: false, // 点赞动画显示状态
		likeAnimType: 'like', // 动画类型：like-点赞, unlike-取消点赞
		likeAnimKey: 0, // 动画key，用于重新触发动画
		likeAnimTimer: null // 点赞动画定时器ID
	},

	async onLoad(options) {
		// 检查是否从登录过期跳转过来
		const showAuth = options && options.showAuth === 'true';
		
		try {
			const token = wx.getStorageSync('token');
			if (token && !showAuth) {
				// 已登录，加载数据
				this.loadUserInfo();
				this.loadBabyImages();
				this.loadPhotoWallList(true);
			} else {
				// 未登录或登录过期，显示登录弹窗
				this.setData({
					authVisible: true
				});
				
				// 如果是登录过期，显示提示
				if (showAuth) {
					wx.showToast({
						title: '登录已过期，请重新登录',
						icon: 'none',
						duration: 2000
					});
				}
			}
		} catch (e) {
			console.error('初始化失败:', e);
			this.setData({
				authVisible: true
			});
		}
	},

	onShow() {
		// 页面显示时检查登录状态并刷新数据
		const token = wx.getStorageSync('token');
		if (token && !this.data.authVisible) {
			// 已登录且未显示登录弹窗，刷新数据
			this.loadBabyImages();
			// 如果当前没有数据，重新加载
			if (this.data.posts.length === 0) {
				this.loadPhotoWallList(true);
			}
		}
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
			
			// 保存完整用户信息（用于评论和删除权限判断）
			this.setData({
				userInfo: userInfo || {},
				currentUserId: userInfo ? userInfo.id : null,
				isHouseholder: userInfo ? userInfo.isHouseholder : false
			});
			
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
					
					if (latestUserInfo) {
						wx.setStorageSync('userInfo', latestUserInfo);
						
						// 更新用户信息到data
						this.setData({
							userInfo: latestUserInfo
						});
						
						if (latestUserInfo.userAvatarUrl) {
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
				this.setData({
					userAvatar: userInfo.userAvatarUrl
				});
			} else {
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

			if (result && result.list) {
				// 转换数据格式
				const formattedPosts = result.list.map((item, index) => {
					return {
						id: item.id,
						createUserId: item.createUserId, // 发布者ID（用于删除权限判断）
						nick: item.createUserRoleName || '家庭成员',
						avatar: item.createUserAvatar && item.createUserAvatar.trim() !== '' 
							? item.createUserAvatar 
							: '/assets/default.png',
						text: item.content || '',
						time: this.formatTime(item.postTime || item.createTime),
						loc: item.location || '',
						liked: item.liked || false,
						likeCount: item.likeCount || 0,
						commentCount: 0,
						images: Array.isArray(item.images) ? item.images : [],
						previewComments: [] // 预览评论（前3条）
					};
				});

				// 加载每个帖子的前3条评论
				await this.loadPreviewComments(formattedPosts);

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
	 * 加载帖子的预览评论（前3条）
	 */
	async loadPreviewComments(posts) {
		try {
			// 并发加载所有帖子的评论
			const commentPromises = posts.map(post => 
				api.getCommentList(post.id).catch(err => {
					console.error(`加载帖子${post.id}的评论失败:`, err);
					return [];
				})
			);

			const commentsResults = await Promise.all(commentPromises);

			// 为每个帖子设置前3条评论
			posts.forEach((post, index) => {
				const comments = commentsResults[index] || [];
				post.previewComments = comments.slice(0, 3).map(comment => ({
					id: comment.id,
					userName: comment.userName,
					userRoleName: comment.userRoleName,
					commentContent: comment.commentContent,
					parentUserName: comment.parentUserName
				}));
				// 更新评论总数
				post.commentCount = comments.length;
			});
		} catch (error) {
			console.error('批量加载评论失败:', error);
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
		// 头像加载成功
	},

	/**
	 * 头像加载失败
	 */
	onAvatarError(e) {
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

			// 显示点赞动画
			this.showLikeAnimation(post.liked);

			// 调用API
			const result = await api.togglePhotoWallLike(token, post.id);

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
	 * 显示点赞动画
	 */
	showLikeAnimation(isLike) {
		// 清除之前的定时器，防止动画被过早隐藏
		if (this.data.likeAnimTimer) {
			clearTimeout(this.data.likeAnimTimer);
		}

		this.setData({
			likeAnimVisible: true,
			likeAnimType: isLike ? 'like' : 'unlike',
			likeAnimKey: this.data.likeAnimKey + 1
		});

		// 1秒后隐藏动画
		const timer = setTimeout(() => {
			this.setData({
				likeAnimVisible: false,
				likeAnimTimer: null
			});
		}, 1000);

		// 保存定时器ID
		this.setData({
			likeAnimTimer: timer
		});
	},

	/**
	 * 删除动态
	 */
	async onDelete(e) {
		const index = e.currentTarget.dataset.index;
		const post = this.data.posts[index];

		// 权限检查
		if (post.createUserId !== this.data.currentUserId && !this.data.isHouseholder) {
			wx.showToast({
				title: '无权删除此动态',
				icon: 'none'
			});
			return;
		}

		// 确认删除
		wx.showModal({
			title: '确认删除',
			content: '确定要删除这条动态吗？删除后无法恢复。',
			confirmText: '删除',
			confirmColor: '#ff4444',
			success: async (res) => {
				if (res.confirm) {
					try {
						wx.showLoading({
							title: '删除中...',
							mask: true
						});

						const token = wx.getStorageSync('token');
						if (!token) {
							wx.hideLoading();
							wx.showToast({
								title: '请先登录',
								icon: 'none'
							});
							return;
						}

						// 调用删除接口
						await api.deletePhotoWall(token, post.id);

						// 删除成功，从列表中移除
						const posts = this.data.posts;
						posts.splice(index, 1);

						wx.hideLoading();
						wx.showToast({
							title: '删除成功',
							icon: 'success'
						});

						this.setData({
							posts: posts
						});

					} catch (error) {
						console.error('删除动态失败:', error);
						wx.hideLoading();
						wx.showToast({
							title: '删除失败，请重试',
							icon: 'none'
						});
					}
				}
			}
		});
	},

	/**
	 * 打开评论弹窗
	 */
	async onComment(e) {
		const index = e.currentTarget.dataset.index;
		const post = this.data.posts[index];

		this.setData({
			commentVisible: true,
			currentPhotoWallId: post.id,
			currentPostIndex: index,
			comments: [],
			commentInput: '',
			replyToCommentId: null,
			replyToUserName: ''
		});

		// 加载评论列表
		await this.loadComments(post.id);
	},

	/**
	 * 关闭评论弹窗
	 */
	closeCommentDialog() {
		this.setData({
			commentVisible: false,
			currentPhotoWallId: null,
			currentPostIndex: null,
			comments: [],
			commentInput: '',
			replyToCommentId: null,
			replyToUserName: ''
		});
	},

	/**
	 * 阻止评论弹窗事件冒泡
	 */
	stopCommentPropagation() {
		// 防止点击弹窗内容时触发关闭
	},

	/**
	 * 加载评论列表
	 */
	async loadComments(photoWallId) {
		try {
			const comments = await api.getCommentList(photoWallId);
			
			// 格式化评论时间
			const formattedComments = (comments || []).map(comment => ({
				...comment,
				createTime: this.formatCommentTime(comment.createTime)
			}));
			
			this.setData({
				comments: formattedComments
			});

			// 更新帖子的评论数量
			const posts = this.data.posts;
			const postIndex = this.data.currentPostIndex;
			if (postIndex !== null && posts[postIndex]) {
				posts[postIndex].commentCount = comments ? comments.length : 0;
				this.setData({
					posts: posts
				});
			}
		} catch (error) {
			console.error('加载评论失败:', error);
		}
	},

	/**
	 * 格式化评论时间（友好显示）
	 */
	formatCommentTime(dateStr) {
		if (!dateStr) return '';
		
		const date = new Date(dateStr);
		const now = new Date();
		const diff = now - date;
		
		// 一分钟内
		if (diff < 60 * 1000) {
			return '刚刚';
		}
		
		// 一小时内
		if (diff < 60 * 60 * 1000) {
			const minutes = Math.floor(diff / (60 * 1000));
			return `${minutes}分钟前`;
		}
		
		// 一天内
		if (diff < 24 * 60 * 60 * 1000) {
			const hours = Math.floor(diff / (60 * 60 * 1000));
			return `${hours}小时前`;
		}
		
		// 一周内
		if (diff < 7 * 24 * 60 * 60 * 1000) {
			const days = Math.floor(diff / (24 * 60 * 60 * 1000));
			return `${days}天前`;
		}
		
		// 超过一周，显示具体日期
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		
		// 如果是今年，不显示年份
		if (year === now.getFullYear()) {
			return `${month}-${day}`;
		}
		
		return `${year}-${month}-${day}`;
	},

	/**
	 * 评论输入框内容变化
	 */
	onCommentInput(e) {
		this.setData({
			commentInput: e.detail.value
		});
	},

	/**
	 * 发表评论
	 */
	async onSubmitComment() {
		const token = wx.getStorageSync('token');
		if (!token) {
			wx.showToast({
				title: '请先登录',
				icon: 'none'
			});
			return;
		}

		const { commentInput, currentPhotoWallId, replyToCommentId, replyToUserName } = this.data;
		
		if (!commentInput || !commentInput.trim()) {
			wx.showToast({
				title: '请输入评论内容',
				icon: 'none'
			});
			return;
		}

		try {
			wx.showLoading({
				title: '发表中...',
				mask: true
			});

			await api.createComment(
				token,
				currentPhotoWallId,
				commentInput.trim(),
				replyToCommentId
			);

			wx.hideLoading();
			wx.showToast({
				title: replyToCommentId ? '回复成功' : '评论成功',
				icon: 'success'
			});

			// 清空输入框和回复状态
			this.setData({
				commentInput: '',
				replyToCommentId: null,
				replyToUserName: ''
			});

			// 重新加载评论列表
			await this.loadComments(currentPhotoWallId);
			
			// 同时更新预览评论
			await this.updatePostPreviewComments(currentPhotoWallId);
		} catch (error) {
			wx.hideLoading();
			console.error('发表评论失败:', error);
			wx.showToast({
				title: '发表失败，请重试',
				icon: 'none'
			});
		}
	},

	/**
	 * 回复评论
	 */
	onReplyComment(e) {
		const commentId = e.currentTarget.dataset.commentId;
		const userName = e.currentTarget.dataset.userName;

		this.setData({
			replyToCommentId: commentId,
			replyToUserName: userName,
			commentInput: ''
		});

		// 聚焦输入框
		this.setData({
			inputFocus: true
		});
	},

	/**
	 * 取消回复
	 */
	onCancelReply() {
		this.setData({
			replyToCommentId: null,
			replyToUserName: '',
			commentInput: ''
		});
	},

	/**
	 * 删除评论
	 */
	async onDeleteComment(e) {
		const commentId = e.currentTarget.dataset.commentId;
		const token = wx.getStorageSync('token');

		if (!token) {
			wx.showToast({
				title: '请先登录',
				icon: 'none'
			});
			return;
		}

		wx.showModal({
			title: '提示',
			content: '确定要删除这条评论吗？',
			confirmColor: '#0052d9',
			success: async (res) => {
				if (res.confirm) {
					try {
						wx.showLoading({
							title: '删除中...',
							mask: true
						});

						await api.deleteComment(token, commentId);

						wx.hideLoading();
						wx.showToast({
							title: '删除成功',
							icon: 'success'
						});

						// 重新加载评论列表
						await this.loadComments(this.data.currentPhotoWallId);
						
						// 同时更新预览评论
						await this.updatePostPreviewComments(this.data.currentPhotoWallId);
					} catch (error) {
						wx.hideLoading();
						console.error('删除评论失败:', error);
						wx.showToast({
							title: '删除失败，请重试',
							icon: 'none'
						});
					}
				}
			}
		});
	},

	/**
	 * 更新单个帖子的预览评论
	 */
	async updatePostPreviewComments(photoWallId) {
		try {
			const comments = await api.getCommentList(photoWallId);
			const posts = this.data.posts;
			const postIndex = posts.findIndex(post => post.id === photoWallId);
			
			if (postIndex !== -1) {
				posts[postIndex].previewComments = comments.slice(0, 3).map(comment => ({
					id: comment.id,
					userName: comment.userName,
					userRoleName: comment.userRoleName,
					commentContent: comment.commentContent,
					parentUserName: comment.parentUserName
				}));
				posts[postIndex].commentCount = comments.length;
				
				this.setData({
					posts: posts
				});
			}
		} catch (error) {
			console.error('更新预览评论失败:', error);
		}
	},

	/**
	 * 关闭登录弹窗
	 */
	closeAuth() {
		// 不允许直接关闭，必须登录
	},

	/**
	 * 阻止事件冒泡
	 */
	stopPropagation() {
		// 防止点击弹窗内容时触发mask的点击事件
	},

	/**
	 * 微信授权登录
	 */
	onGetUserProfile(e) {
		wx.getUserProfile({
			desc: '展示用户信息',
			success: (res) => {
				const userInfo = res.userInfo;
				// 缓存用户基础信息
				wx.setStorageSync('nickname', userInfo.nickName || '');
				wx.setStorageSync('avatarUrl', userInfo.avatarUrl || '');
				// 完成后继续登录流程
				this.serverLogin();
			},
			fail: (err) => {
				wx.showToast({
					title: '未授权，无法获取昵称和头像',
					icon: 'none',
					duration: 1500
				});
			}
		});
	},

	/**
	 * 服务器登录
	 */
	async serverLogin() {
		if (this.data.loading) return;
		this.setData({
			loading: true
		});
		
		try {
			// 1. 获取登录凭证code
			const { code } = await wx.login();
			if (!code) {
				throw new Error('获取code失败');
			}
			
			// 2. 登录换取token
			const loginData = await api.userLogin(code);
			const token = loginData && loginData.token;
			if (!token) {
				throw new Error('登录失败');
			}
			
			// 3. 存储token
			wx.setStorageSync('token', token);
			
			// 4. 获取用户信息
			const userRes = await api.getUserInfo(token);
			let user;
			if (userRes && typeof userRes.code !== 'undefined') {
				if (userRes.code !== 0) {
					wx.showToast({
						title: userRes.message || '获取用户信息失败',
						icon: 'none'
					});
					return;
				}
				user = userRes.data;
			} else {
				user = userRes;
			}
			
			if (!user) {
				throw new Error('获取用户信息失败');
			}

			// 5. 保存用户信息到缓存
			wx.setStorageSync('userInfo', user);
			
			// 6. 更新昵称和头像
			if (user.userName) {
				wx.setStorageSync('nickname', user.userName);
			}
			if (user.userAvatarUrl) {
				wx.setStorageSync('avatarUrl', user.userAvatarUrl);
			}

			// 7. 根据是否有家庭ID判断跳转
			if (user.homeId) {
				// 已加入家庭，先关闭弹窗，然后加载数据
				this.setData({
					authVisible: false,
					pageNum: 1,
					posts: [],
					hasMore: true
				});
				
				// 延迟一下确保UI更新完成
				setTimeout(() => {
					wx.showToast({
						title: '登录成功',
						icon: 'success'
					});
					
					// 加载用户信息和数据
					this.loadUserInfo();
					this.loadBabyImages();
					this.loadPhotoWallList(true);
				}, 100);
			} else {
				// 未加入家庭，跳转到家庭选择页面
				wx.showToast({
					title: '登录成功，请选择家庭',
					icon: 'success'
				});
				
				setTimeout(() => {
					wx.reLaunch({
						url: '/pages/familySelect/familySelect'
					});
				}, 500);
			}
		} catch (err) {
			console.error('登录失败:', err);
			wx.showToast({
				title: err.message || '登录失败',
				icon: 'none'
			});
		} finally {
			this.setData({
				loading: false
			});
		}
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
