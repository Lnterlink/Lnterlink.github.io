/* ========================================
   我们之间 · 交互叙事作品 - 主逻辑
   ======================================== */
document.addEventListener('DOMContentLoaded', function () {

    // ===== 加载画面 =====
    const loadingScreen = document.getElementById('loading-screen');
    const loadingBar = document.getElementById('loading-bar');
    let loadProgress = 0;

    function updateLoading() {
        loadProgress += Math.random() * 18 + 4;
        if (loadProgress > 100) loadProgress = 100;
        loadingBar.style.width = loadProgress + '%';
        if (loadProgress < 100) {
            setTimeout(updateLoading, 120 + Math.random() * 200);
        } else {
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                initAll();
            }, 400);
        }
    }
    setTimeout(updateLoading, 300);

    // ===== 音频管理器 =====
    const AudioManager = {
        bgmEnabled: true,
        voiceEnabled: true,
        currentBGM: null,
        bgmVolume: 0.10,
        voiceVolume: 1.0,
        fadeDuration: 2000,
        voiceAudio: null,
        bgmXiangcun: null,
        bgmGuilai: null,
        _fadeAnim: null,

        init() {
            this.bgmXiangcun = document.getElementById('bgm-xiangcun');
            this.bgmGuilai = document.getElementById('bgm-guilai');
            this.voiceAudio = document.getElementById('voice-audio');
            if (this.bgmXiangcun) this.bgmXiangcun.volume = 0;
            if (this.bgmGuilai) this.bgmGuilai.volume = 0;
            if (this.voiceAudio) this.voiceAudio.volume = this.voiceVolume;
        },

        _pad3(n) {
            return String(n).padStart(3, '0');
        },

        _fadeIn(audio) {
            if (this._fadeAnim) cancelAnimationFrame(this._fadeAnim);
            const target = this.bgmVolume;
            const dur = this.fadeDuration;
            audio.volume = 0;
            const start = performance.now();
            const step = (now) => {
                const p = Math.min((now - start) / dur, 1);
                audio.volume = target * (1 - Math.pow(1 - p, 3));
                if (p < 1) this._fadeAnim = requestAnimationFrame(step);
            };
            this._fadeAnim = requestAnimationFrame(step);
        },

        _fadeOut(audio, cb) {
            if (!audio || audio.paused) { if (cb) cb(); return; }
            const startVol = audio.volume;
            const dur = 800;
            const start = performance.now();
            const step = (now) => {
                const p = Math.min((now - start) / dur, 1);
                audio.volume = startVol * (1 - p);
                if (p < 1) {
                    requestAnimationFrame(step);
                } else {
                    audio.pause();
                    audio.currentTime = 0;
                    audio.volume = 0;
                    if (cb) cb();
                }
            };
            requestAnimationFrame(step);
        },

        playBGM(name) {
            if (!this.bgmEnabled) return;
            const target = name === 'guilai' ? this.bgmGuilai : this.bgmXiangcun;
            if (!target) return;
            if (this.currentBGM === target && !target.paused) return;
            const old = this.currentBGM;
            this.currentBGM = target;
            if (old && old !== target) {
                this._fadeOut(old, () => {
                    target.currentTime = 0;
                    target.play().then(() => this._fadeIn(target)).catch(() => {});
                });
            } else {
                target.currentTime = 0;
                target.play().then(() => this._fadeIn(target)).catch(() => {});
            }
            this._updateBtn(true);
        },

        restartBGM() {
            if (!this.bgmEnabled || !this.currentBGM) return;
            this.currentBGM.currentTime = 0;
            this.currentBGM.play().then(() => this._fadeIn(this.currentBGM)).catch(() => {});
        },

        stopBGM() {
            if (this._fadeAnim) cancelAnimationFrame(this._fadeAnim);
            [this.bgmXiangcun, this.bgmGuilai].forEach(a => {
                if (a) { a.pause(); a.currentTime = 0; a.volume = 0; }
            });
            this.currentBGM = null;
            this._updateBtn(false);
        },

        toggleBGM() {
            this.bgmEnabled = !this.bgmEnabled;
            if (this.bgmEnabled) {
                if (this.currentBGM) {
                    this.currentBGM.play().then(() => this._fadeIn(this.currentBGM)).catch(() => {});
                }
                this._updateBtn(true);
            } else {
                [this.bgmXiangcun, this.bgmGuilai].forEach(a => { if (a) a.pause(); });
                this._updateBtn(false);
            }
        },

        _updateBtn(playing) {
            const btn = document.getElementById('bgm-toggle-btn');
            const icon = document.getElementById('bgm-icon');
            if (!btn || !icon) return;
            btn.classList.toggle('muted', !this.bgmEnabled);
            btn.classList.toggle('playing', playing && this.bgmEnabled);
            icon.className = this.bgmEnabled ? 'fas fa-music' : 'fas fa-volume-mute';
        },

        playVoice(sceneId, speaker, characterLeft) {
            this.stopVoice();
            if (!this.voiceEnabled) return;
            if (speaker === '旁白') return;
            let dir = null;
            if (speaker === '林远') {
                dir = characterLeft === 'adult_linyuan' ? 'linyuan_adult' : 'linyuan_young';
            } else if (speaker === '老周') {
                dir = 'oldzhou';
            } else if (speaker === '老板娘') {
                dir = 'shopkeeper';
            }
            if (!dir) return;
            const path = 'sound/Voice/' + dir + '/scene_' + this._pad3(sceneId) + '.wav';
            this.voiceAudio.src = path;
            this.voiceAudio.volume = this.voiceVolume;
            this.voiceAudio.play().catch(() => {});
        },

        stopVoice() {
            if (this.voiceAudio) {
                this.voiceAudio.pause();
                this.voiceAudio.currentTime = 0;
            }
        },

        isVoicePlaying() {
            return this.voiceAudio && !this.voiceAudio.paused && this.voiceAudio.currentTime > 0;
        },

        setVoiceEnabled(on) {
            this.voiceEnabled = on;
            if (!on) this.stopVoice();
        },

        setBGMVolume(vol) {
            this.bgmVolume = Math.max(0, Math.min(1, vol));
            if (this.currentBGM) {
                this.currentBGM.volume = this.bgmEnabled ? this.bgmVolume : 0;
            }
        },

        setVoiceVolume(vol) {
            this.voiceVolume = Math.max(0, Math.min(1, vol));
            if (this.voiceAudio) {
                this.voiceAudio.volume = this.voiceVolume;
            }
        }
    };

    // 页面首次交互时解锁音频
    function initAudioOnInteraction() {
        AudioManager.init();
        const unlock = () => {
            if (AudioManager.bgmXiangcun) AudioManager.bgmXiangcun.load();
            if (AudioManager.bgmGuilai) AudioManager.bgmGuilai.load();
            AudioManager.playBGM('xiangcun');
            document.removeEventListener('click', unlock);
            document.removeEventListener('touchstart', unlock);
        };
        document.addEventListener('click', unlock, { once: true });
        document.addEventListener('touchstart', unlock, { once: true });
    }

    // ===== 粒子系统 =====
    const particleCanvas = document.getElementById('particle-canvas');
    const pCtx = particleCanvas.getContext('2d');
    let particles = [];

    function resizeParticleCanvas() {
        particleCanvas.width = window.innerWidth;
        particleCanvas.height = window.innerHeight;
    }
    resizeParticleCanvas();
    window.addEventListener('resize', resizeParticleCanvas);

    class Particle {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * particleCanvas.width;
            this.y = Math.random() * particleCanvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedY = -(Math.random() * 0.3 + 0.1);
            this.speedX = (Math.random() - 0.5) * 0.2;
            this.opacity = Math.random() * 0.4 + 0.1;
            this.life = Math.random() * 200 + 100;
            this.maxLife = this.life;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.life--;
            this.opacity = (this.life / this.maxLife) * 0.4;
            if (this.life <= 0 || this.y < -10) this.reset();
        }
        draw() {
            pCtx.beginPath();
            pCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            pCtx.fillStyle = `rgba(216, 154, 74, ${this.opacity})`;
            pCtx.fill();
        }
    }

    function initParticles() {
        const count = Math.min(50, Math.floor(window.innerWidth / 25));
        particles = [];
        for (let i = 0; i < count; i++) {
            particles.push(new Particle());
        }
    }

    function animateParticles() {
        pCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animateParticles);
    }

    // ===== Hero 星星 =====
    function createStars() {
        const container = document.getElementById('hero-stars');
        if (!container) return;
        for (let i = 0; i < 40; i++) {
            const star = document.createElement('div');
            star.className = 'hero-star';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 60 + '%';
            star.style.setProperty('--dur', (2 + Math.random() * 4) + 's');
            star.style.animationDelay = Math.random() * 3 + 's';
            star.style.width = (1.5 + Math.random() * 2) + 'px';
            star.style.height = star.style.width;
            container.appendChild(star);
        }
    }

    // ===== 导航栏 =====
    const navBar = document.getElementById('nav-bar');
    const navLinks = document.querySelectorAll('.nav-link');
    const navMenuBtn = document.getElementById('nav-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-menu-link');

    function handleScroll() {
        if (window.scrollY > 60) {
            navBar.classList.add('scrolled');
        } else {
            navBar.classList.remove('scrolled');
        }
        updateActiveNav();
    }

    function updateActiveNav() {
        const sections = document.querySelectorAll('.section');
        let currentId = 'hero';
        sections.forEach(sec => {
            const rect = sec.getBoundingClientRect();
            if (rect.top <= window.innerHeight * 0.4) {
                currentId = sec.id;
            }
        });
        navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.section === currentId);
        });
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    navMenuBtn.addEventListener('click', () => {
        navMenuBtn.classList.toggle('open');
        mobileMenu.classList.toggle('open');
    });

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenuBtn.classList.remove('open');
            mobileMenu.classList.remove('open');
        });
    });

    // ===== 点击涟漪效果 =====
    const clickRipple = document.getElementById('click-ripple');

    document.addEventListener('click', (e) => {
        clickRipple.style.left = (e.clientX - 10) + 'px';
        clickRipple.style.top = (e.clientY - 10) + 'px';
        clickRipple.classList.remove('active');
        void clickRipple.offsetWidth;
        clickRipple.classList.add('active');
        setTimeout(() => clickRipple.classList.remove('active'), 700);
    });

    // ===== 滚动动画 (Intersection Observer) =====
    function setupScrollAnimations() {
        const revealEls = document.querySelectorAll('.reveal-up, .reveal-text, .timeline-item, .gallery-card');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const delay = parseInt(entry.target.dataset.delay || '0');
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                        entry.target.classList.add('revealed');
                    }, delay);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

        revealEls.forEach(el => observer.observe(el));
    }

    // ===== 时间线交互 =====
    function setupTimeline() {
        const timelineProgress = document.getElementById('timeline-progress');
        const timelineItems = document.querySelectorAll('.timeline-item');

        timelineItems.forEach((item, idx) => {
            const dot = item.querySelector('.timeline-dot');
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                timelineItems.forEach(t => t.classList.remove('active'));
                item.classList.add('active');
                const pct = ((idx + 1) / timelineItems.length) * 100;
                timelineProgress.style.height = pct + '%';
            });

            item.addEventListener('click', () => {
                timelineItems.forEach(t => t.classList.remove('active'));
                item.classList.add('active');
                const pct = ((idx + 1) / timelineItems.length) * 100;
                timelineProgress.style.height = pct + '%';
            });
        });

        // 自动高亮滚动到的项
        const tlObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const idx = parseInt(entry.target.dataset.index);
                    const pct = ((idx + 1) / timelineItems.length) * 100;
                    timelineProgress.style.height = pct + '%';
                }
            });
        }, { threshold: 0.5 });

        timelineItems.forEach(item => tlObserver.observe(item));
    }

    // ===== Gallery 语录弹窗 =====
    function setupGallery() {
        const quoteOverlay = document.getElementById('quote-overlay');
        const quoteText = document.getElementById('quote-text');
        const quoteClose = document.getElementById('quote-close');

        document.querySelectorAll('.gallery-card').forEach(card => {
            card.addEventListener('click', () => {
                const q = card.dataset.quote;
                if (q) {
                    quoteText.textContent = q;
                    quoteOverlay.classList.add('active');
                }
            });
        });

        quoteClose.addEventListener('click', (e) => {
            e.stopPropagation();
            quoteOverlay.classList.remove('active');
        });

        quoteOverlay.addEventListener('click', (e) => {
            if (e.target === quoteOverlay) {
                quoteOverlay.classList.remove('active');
            }
        });
    }

    // ===== 终章粒子 =====
    function setupEndingParticles() {
        const container = document.getElementById('ending-particles');
        if (!container) return;
        for (let i = 0; i < 12; i++) {
            const p = document.createElement('div');
            p.className = 'ending-particle';
            p.style.left = Math.random() * 100 + '%';
            p.style.setProperty('--size', (2 + Math.random() * 3) + 'px');
            p.style.setProperty('--dur', (6 + Math.random() * 8) + 's');
            p.style.setProperty('--delay', (Math.random() * 6) + 's');
            p.style.setProperty('--drift', (Math.random() * 40 - 20) + 'px');
            container.appendChild(p);
        }
    }

    // ========================================
    // 视觉小说核心逻辑（保留原有功能）
    // ========================================

    const scenes = [
        { id:0, speaker:"旁白", text:"2017年，老周第一次注意到那个孩子，是在七月。", background:"hillside", characterLeft:"", characterRight:"", interactive:"tower" },
        { id:1, speaker:"旁白", text:"他巡线经过旧仓村外的山坡，下午两点，日头正毒。银白色的铁塔在庄稼地里投下几何形状的影子，他照例绕塔基走一圈，检查螺栓、接地线，记录塔材有无变形。", background:"hillside", characterLeft:"", characterRight:"", interactive:"tower" },
        { id:2, speaker:"旁白", text:"做完这些，他蹲在阴影里喝水，才看见坡底下坐着个人。一个男孩，十二三岁的样子，蹲在花生地边上，拿一根树枝在地上划拉。旁边放着个塑料袋，里面是半袋晒干的花生。", background:"hillside", characterLeft:"boy", characterRight:"", interactive:"tower" },
        { id:3, speaker:"旁白", text:"老周没出声。他巡线二十年，见过很多这样的孩子——父母在外打工，跟着老人留在村里，暑假里帮工、放牛、发呆。没什么稀奇。", background:"hillside", characterLeft:"boy", characterRight:"", interactive:"tower" },
        { id:4, speaker:"旁白", text:"他喝完水，把水壶别回腰上，沿线路往下一基塔走。走了不到五十米，听见身后有人跑过来。", background:"hillside", characterLeft:"boy", characterRight:"", interactive:"tower" },
        { id:5, speaker:"林远", text:"叔，你是供电局的？", background:"hillside", characterLeft:"boy", characterRight:"", interactive:"tower" },
        { id:6, speaker:"旁白", text:"老周回头看他。晒得黑瘦，眼睛亮，穿着一件洗到发白的校服短袖。他点了下头。", background:"hillside", characterLeft:"boy", characterRight:"oldzhou", interactive:"tower" },
        { id:7, speaker:"林远", text:"塔上那个，那个红色的灯，晚上会闪的，是干什么用的？", background:"hillside", characterLeft:"boy", characterRight:"oldzhou", interactive:"tower" },
        { id:8, speaker:"老周", text:"航空警示灯。飞机看得见，不会撞上。", background:"hillside", characterLeft:"boy", characterRight:"oldzhou", interactive:"tower" },
        { id:9, speaker:"林远", text:"哦。那它一晚上闪多少下？", background:"hillside", characterLeft:"boy", characterRight:"oldzhou", interactive:"tower" },
        { id:10, speaker:"旁白", text:"老周愣了一下。他从来没数过。", background:"hillside", characterLeft:"boy", characterRight:"oldzhou", interactive:"tower" },
        { id:11, speaker:"老周", text:"不知道。", background:"hillside", characterLeft:"boy", characterRight:"oldzhou", interactive:"tower" },
        { id:12, speaker:"旁白", text:"孩子点点头，好像这个答案他早就料到了。然后他转身跑回花生地，塑料袋拎起来，往村里走了。那是第一次。", background:"hillside", characterLeft:"", characterRight:"oldzhou", interactive:"tower" },
        { id:13, speaker:"旁白", text:"后来老周知道了，这孩子叫林远，开学上初一。母亲在深圳的电子厂，父亲跟着建筑队全国各地跑。他跟外婆住。", background:"village", characterLeft:"", characterRight:"", interactive:"none" },
        { id:14, speaker:"旁白", text:"老周每周巡这条线两到三次。旧仓村这一段有十七基塔，从山坡上的转角塔开始，一直延伸到海边。", background:"village", characterLeft:"", characterRight:"", interactive:"none" },
        { id:15, speaker:"旁白", text:"线路是十年前架的，塔材有些已经生锈，但结构还稳。他每次经过村口，偶尔会碰见林远。", background:"village", characterLeft:"boy", characterRight:"", interactive:"none" },
        { id:16, speaker:"旁白", text:"碰上了就点个头，算是招呼。", background:"village", characterLeft:"boy", characterRight:"", interactive:"none" },
        { id:17, speaker:"旁白", text:"有一次老周在村口检修变压器，林远站在旁边看了半小时。等他忙完，孩子递过来一瓶水，温的，瓶身还沾着井台上的泥沙。", background:"village", characterLeft:"boy", characterRight:"oldzhou", interactive:"none" },
        { id:18, speaker:"林远", text:"叔，你们这工作，要做多少年？", background:"village", characterLeft:"boy", characterRight:"oldzhou", interactive:"none" },
        { id:19, speaker:"老周", text:"做到退休。", background:"village", characterLeft:"boy", characterRight:"oldzhou", interactive:"none" },
        { id:20, speaker:"林远", text:"一直做这个？", background:"village", characterLeft:"boy", characterRight:"oldzhou", interactive:"none" },
        { id:21, speaker:"老周", text:"一直做这个。", background:"village", characterLeft:"boy", characterRight:"oldzhou", interactive:"none" },
        { id:22, speaker:"旁白", text:"林远想了一会儿。那你是不是把这条线上的每一基塔都记住了？", background:"village", characterLeft:"boy", characterRight:"oldzhou", interactive:"none" },
        { id:23, speaker:"老周", text:"记住了。", background:"village", characterLeft:"boy", characterRight:"oldzhou", interactive:"none" },
        { id:24, speaker:"旁白", text:"孩子没有再问。", background:"village", characterLeft:"", characterRight:"", interactive:"none" },
        { id:25, speaker:"旁白", text:"2019年秋天，老周在旧仓村外面的第九基塔下面，发现林远坐在塔基上。", background:"sunset", characterLeft:"", characterRight:"", interactive:"none" },
        { id:26, speaker:"旁白", text:"那是下午五点多，太阳斜在山脊上，铁塔的影子拉得很长。孩子手里拿着一部旧手机，屏幕碎了，但还能用。", background:"sunset", characterLeft:"boy", characterRight:"", interactive:"none" },
        { id:27, speaker:"旁白", text:"老周走过去。林远抬头看了他一眼，又把头低下去。", background:"sunset", characterLeft:"boy", characterRight:"oldzhou", interactive:"none" },
        { id:28, speaker:"林远", text:"我爸寄回来的。", background:"sunset", characterLeft:"boy", characterRight:"oldzhou", interactive:"none" },
        { id:29, speaker:"旁白", text:"他把手机翻过来给老周看。屏幕上是一张照片，一个穿工装的中年男人站在工地前面，背后是还没封顶的楼。", background:"sunset", characterLeft:"boy", characterRight:"oldzhou", interactive:"none" },
        { id:30, speaker:"林远", text:"深圳。他说今年又不回来过年。", background:"sunset", characterLeft:"boy", characterRight:"oldzhou", interactive:"none" },
        { id:31, speaker:"旁白", text:"老周没说话。他在塔基另一头坐下来，把工具包放在地上。", background:"sunset", characterLeft:"boy", characterRight:"oldzhou", interactive:"none" },
        { id:32, speaker:"林远", text:"叔，这个塔，它发的电是送到哪里的？", background:"sunset", characterLeft:"boy", characterRight:"oldzhou", interactive:"tower" },
        { id:33, speaker:"老周", text:"并网的。送到变电站，再分到各个地方。", background:"sunset", characterLeft:"boy", characterRight:"oldzhou", interactive:"tower" },
        { id:34, speaker:"林远", text:"有没有可能送到深圳？", background:"sunset", characterLeft:"boy", characterRight:"oldzhou", interactive:"tower" },
        { id:35, speaker:"老周", text:"有可能。", background:"sunset", characterLeft:"boy", characterRight:"oldzhou", interactive:"tower" },
        { id:36, speaker:"旁白", text:"林远看着塔顶，银白色的塔材在夕光里泛着暖色。", background:"sunset", characterLeft:"boy", characterRight:"oldzhou", interactive:"tower" },
        { id:37, speaker:"林远", text:"那它闪灯的时候，我爸能不能看见？", background:"sunset", characterLeft:"boy", characterRight:"oldzhou", interactive:"tower" },
        { id:38, speaker:"老周", text:"太远了，看不见。", background:"sunset", characterLeft:"boy", characterRight:"oldzhou", interactive:"tower" },
        { id:39, speaker:"旁白", text:"林远从塔基上跳下来，拍了拍裤子上的铁锈。他把手机揣回口袋，往村里走了几步，又停下来。", background:"sunset", characterLeft:"boy", characterRight:"oldzhou", interactive:"none" },
        { id:40, speaker:"林远", text:"叔，你下次什么时候来？", background:"sunset", characterLeft:"boy", characterRight:"oldzhou", interactive:"none" },
        { id:41, speaker:"老周", text:"后天。", background:"sunset", characterLeft:"boy", characterRight:"oldzhou", interactive:"none" },
        { id:42, speaker:"林远", text:"那你后天来的时候，能不能跟我说说，这塔是怎么架起来的。", background:"sunset", characterLeft:"boy", characterRight:"oldzhou", interactive:"none" },
        { id:43, speaker:"老周", text:"好。", background:"sunset", characterLeft:"boy", characterRight:"oldzhou", interactive:"none" },
        { id:44, speaker:"旁白", text:"后来老周真的讲了。讲怎么打基础，怎么立塔，怎么放线。", background:"towerbase", characterLeft:"boy", characterRight:"oldzhou", interactive:"tower" },
        { id:45, speaker:"旁白", text:"讲他刚参加工作那会儿，这条线路还没架，旧仓村还用着七十年代的老线路，夏天电压不稳，电扇转起来都费劲。", background:"towerbase", characterLeft:"boy", characterRight:"oldzhou", interactive:"tower" },
        { id:46, speaker:"旁白", text:"讲架这条线的时候，村里人出来帮忙抬材料，塔基的水泥是大家一桶一桶拎上去的。", background:"towerbase", characterLeft:"boy", characterRight:"oldzhou", interactive:"tower" },
        { id:47, speaker:"老周", text:"你爸妈的电话经常打吗？", background:"towerbase", characterLeft:"boy", characterRight:"oldzhou", interactive:"none" },
        { id:48, speaker:"林远", text:"以前打得多。现在少了。不知道说什么。", background:"towerbase", characterLeft:"boy", characterRight:"oldzhou", interactive:"none" },
        { id:49, speaker:"老周", text:"说什么都行。", background:"towerbase", characterLeft:"boy", characterRight:"oldzhou", interactive:"none" },
        { id:50, speaker:"林远", text:"说完了，就挂。挂了更没意思。", background:"towerbase", characterLeft:"boy", characterRight:"oldzhou", interactive:"none" },
        { id:51, speaker:"旁白", text:"老周没再劝。他懂那种感觉。他儿子在省城读高中，一个月打一次电话，每次也是那几句——吃了没，冷不冷，钱够不够。说完就沉默，然后挂掉。", background:"towerbase", characterLeft:"boy", characterRight:"oldzhou", interactive:"none" },
        { id:52, speaker:"旁白", text:"塔是送电的，不是送话的。有些东西，能送到，有些东西，送不到。", background:"towerbase", characterLeft:"", characterRight:"", interactive:"tower" },
        { id:53, speaker:"旁白", text:"2021年，林远考上县里的高中。老周再去旧仓村的时候，碰不见他了。", background:"village", characterLeft:"", characterRight:"", interactive:"none" },
        { id:54, speaker:"旁白", text:"村子的变化开始多起来。先是村口那条烂路铺了水泥，然后路边装了太阳能路灯。", background:"village", characterLeft:"", characterRight:"", interactive:"none" },
        { id:55, speaker:"旁白", text:"老周巡线时看见，第九基塔下面的花生地改种了柑橘苗，旁边立了一块牌子，写着「旧仓村红旅采摘园」。", background:"village", characterLeft:"oldzhou", characterRight:"", interactive:"none" },
        { id:56, speaker:"旁白", text:"有一回他在村口的小卖部买水，老板娘说，现在周末有外面的人来玩。来看山，看海，看塔。", background:"village", characterLeft:"oldzhou", characterRight:"", interactive:"none" },
        { id:57, speaker:"老板娘", text:"就是你们那个输电塔呀。有些人觉得好看，拍照。", background:"village", characterLeft:"oldzhou", characterRight:"", interactive:"none" },
        { id:58, speaker:"旁白", text:"老周往山上看了一眼。那些塔在山脊上排成一列，银白色的钢架，拉着一根根弧形的导线。他看了二十年，没觉得有什么好看。但他也没觉得不好看。", background:"village", characterLeft:"oldzhou", characterRight:"", interactive:"none" },
        { id:59, speaker:"老板娘", text:"林远他爸回来了。在村里包了块地养鱼，还弄了个农家乐。", background:"village", characterLeft:"oldzhou", characterRight:"", interactive:"none" },
        { id:60, speaker:"老周", text:"林远呢？", background:"village", characterLeft:"oldzhou", characterRight:"", interactive:"none" },
        { id:61, speaker:"老板娘", text:"读书呀，县里。放假才回来。", background:"village", characterLeft:"oldzhou", characterRight:"", interactive:"none" },
        { id:62, speaker:"旁白", text:"2025年冬天，老周接到通知，旧仓村这一段线路要全面检修，部分老塔需要更换塔材。他带着队进了村。", background:"hillside", characterLeft:"", characterRight:"", interactive:"none" },
        { id:63, speaker:"旁白", text:"在第九基塔下面，他看见一个年轻人站在那里。高了，肩膀宽了，不再是那个黑瘦的孩子。穿一件灰色棉服，手里拿着个笔记本。", background:"hillside", characterLeft:"adult_linyuan", characterRight:"oldzhou", interactive:"tower" },
        { id:64, speaker:"林远", text:"周叔。", background:"hillside", characterLeft:"adult_linyuan", characterRight:"oldzhou", interactive:"tower" },
        { id:65, speaker:"旁白", text:"老周走过去。两个人站在塔下面，风从海那边吹过来，导线发出细微的啸声。", background:"hillside", characterLeft:"adult_linyuan", characterRight:"oldzhou", interactive:"tower" },
        { id:66, speaker:"林远", text:"我大学毕业了，学的电气工程。这次回来，是跟着县供电局实习。", background:"hillside", characterLeft:"adult_linyuan", characterRight:"oldzhou", interactive:"tower" },
        { id:67, speaker:"林远", text:"我想看看这些塔。", background:"hillside", characterLeft:"adult_linyuan", characterRight:"oldzhou", interactive:"tower" },
        { id:68, speaker:"旁白", text:"老周看着他，忽然想起六年前，这孩子坐在塔基上，问他塔上的灯一晚上闪多少下。他没问出来。但现在他想知道答案了。", background:"hillside", characterLeft:"adult_linyuan", characterRight:"oldzhou", interactive:"tower" },
        { id:69, speaker:"旁白", text:"老周从工具包里拿出望远镜，递给林远。林远接过去，对着塔顶看了一会儿。航标灯在白天没有亮，但灯罩还在，红色的，像塔顶上结的一颗果子。", background:"hillside", characterLeft:"adult_linyuan", characterRight:"oldzhou", interactive:"tower" },
        { id:70, speaker:"林远", text:"周叔，我以前觉得，这些塔把我家的地占了，我爸才走的。", background:"hillside", characterLeft:"adult_linyuan", characterRight:"oldzhou", interactive:"tower" },
        { id:71, speaker:"老周", text:"现在呢。", background:"hillside", characterLeft:"adult_linyuan", characterRight:"oldzhou", interactive:"tower" },
        { id:72, speaker:"林远", text:"现在，我觉得它不是把人送走的。是把人叫回来的。", background:"hillside", characterLeft:"adult_linyuan", characterRight:"oldzhou", interactive:"tower" },
        { id:73, speaker:"旁白", text:"老周没接话。他蹲下来，开始检查塔基的螺栓。林远在他旁边蹲下，把笔记本翻开。上面画着这条线路的草图，从旧仓村的山坡一直延伸到海边，十七基塔，一基一基标得清清楚楚。", background:"hillside", characterLeft:"adult_linyuan", characterRight:"oldzhou", interactive:"tower" },
        { id:74, speaker:"老周", text:"你画的？", background:"hillside", characterLeft:"adult_linyuan", characterRight:"oldzhou", interactive:"tower" },
        { id:75, speaker:"林远", text:"画的。", background:"hillside", characterLeft:"adult_linyuan", characterRight:"oldzhou", interactive:"tower" },
        { id:76, speaker:"旁白", text:"老周看了一会儿。", background:"hillside", characterLeft:"adult_linyuan", characterRight:"oldzhou", interactive:"tower" },
        { id:77, speaker:"老周", text:"第九基的螺栓规格写错了。M24，不是M20。", background:"hillside", characterLeft:"adult_linyuan", characterRight:"oldzhou", interactive:"tower" },
        { id:78, speaker:"旁白", text:"林远愣了一下，然后笑了。他拿笔改过来。风还在吹。远处的海面上，落日把铁塔的影子投在橘子林里，和六年前投在花生地上的影子，一模一样。", background:"hillside", characterLeft:"adult_linyuan", characterRight:"oldzhou", interactive:"tower" },
        { id:79, speaker:"老周", text:"走吧，前面还有十六基。", background:"hillside", characterLeft:"adult_linyuan", characterRight:"oldzhou", interactive:"tower" },
    ];

    const chapters = [
        { id:0, title:"初遇", description:"2017年七月，山坡上的第一次相遇", background:"hillside", sceneStart:0, sceneEnd:12, year:"2017年" },
        { id:1, title:"相识", description:"旧仓村，每周的巡线路", background:"village", sceneStart:13, sceneEnd:24, year:"2017年" },
        { id:2, title:"塔下的秘密", description:"2019年秋，第九基塔下的对话", background:"sunset", sceneStart:25, sceneEnd:43, year:"2019年" },
        { id:3, title:"线路工的故事", description:"塔是送电的，也是送心的", background:"towerbase", sceneStart:44, sceneEnd:52, year:"2019年" },
        { id:4, title:"变化", description:"2021年，村子变了，孩子长大了", background:"village", sceneStart:53, sceneEnd:61, year:"2021年" },
        { id:5, title:"归来", description:"2025年冬，两代线路工的对话", background:"hillside", sceneStart:62, sceneEnd:79, year:"2025年" },
    ];

    // 小说状态
    let currentChapterIndex = 0;
    let currentSceneInChapterIndex = 0;
    let currentSceneIndex = 0;
    let currentBackground = '';
    let currentCharLeft = '';
    let currentCharRight = '';
    let isPoweredOn = true;
    let isAutoPlaying = false;
    let autoPlayInterval;
    let textSpeed = 5;
    let typewriterTimeout;

    // DOM
    const sceneBg = document.getElementById('scene-bg');
    const speakerEl = document.getElementById('speaker');
    const dialogueTextEl = document.getElementById('dialogue-text');
    const characterLeftImg = document.getElementById('char-left-img');
    const characterRightImg = document.getElementById('char-right-img');
    const characterLeft = document.getElementById('character-left');
    const characterRight = document.getElementById('character-right');
    const tower = document.getElementById('tower');
    const chapterDisplay = document.getElementById('chapter-display');
    const chapterTitle = document.getElementById('chapter-title');
    const chapterDescription = document.getElementById('chapter-description');
    const chapterYear = document.getElementById('chapter-year');
    const chapterCurrent = document.getElementById('chapter-current');
    const chapterTotal = document.getElementById('chapter-total');
    const powerBtn = document.getElementById('power-btn');
    const nextSceneBtn = document.getElementById('next-scene-btn');
    const prevSceneBtn = document.getElementById('prev-scene-btn');
    const autoBtn = document.getElementById('auto-btn');
    const menuBtn = document.getElementById('menu-btn');
    const menuOverlay = document.getElementById('menu-overlay');
    const closeMenuBtn = document.getElementById('close-menu');
    const textSpeedSlider = document.getElementById('text-speed');
    const autoSpeedSlider = document.getElementById('auto-speed');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const resetBtn = document.getElementById('reset-btn');
    const coverScreen = document.getElementById('cover-screen');

    const backgrounds = {
        hillside: 'url("images/hillside.png") center/cover no-repeat',
        village: 'url("images/village.png") center/cover no-repeat',
        towerbase: 'url("images/towerbase.png") center/cover no-repeat',
        sunset: 'url("images/sunset.png") center/cover no-repeat',
        night: 'url("images/night.png") center/cover no-repeat'
    };

    const characters = {
        boy: 'images/boy.png',
        oldzhou: 'images/oldzhou.png',
        adult_linyuan: 'images/adult_linyuan.png'
    };

    function preloadImages() {
        for (const [key, url] of Object.entries(characters)) {
            const img = new Image();
            img.onerror = () => {
                characters[key] = `https://via.placeholder.com/200x300/556B2F/FFFFFF?text=${encodeURIComponent(key)}`;
            };
            img.src = url;
        }
    }

    function setCharacterImage(imgElement, characterKey) {
        if (!characterKey) {
            imgElement.src = '';
            imgElement.style.opacity = '0';
            return;
        }
        const url = characters[characterKey];
        imgElement.src = url;
        imgElement.style.opacity = '0';
        imgElement.onload = function () {
            this.style.opacity = '1';
            this.style.transition = 'opacity 0.5s ease';
        };
        imgElement.onerror = function () {
            this.src = `https://via.placeholder.com/200x300/556B2F/FFFFFF?text=${encodeURIComponent(characterKey)}`;
            this.style.opacity = '1';
        };
    }

    // 封面点击
    function startStory() {
        if (coverScreen && !coverScreen.classList.contains('hidden')) {
            coverScreen.classList.add('hidden');
            AudioManager.playBGM('xiangcun');
            updateScene();
        }
    }
    if (coverScreen) coverScreen.onclick = startStory;
    var startBtn = document.querySelector('.cover-start');
    if (startBtn) startBtn.onclick = function(e) { e.stopPropagation(); startStory(); };

    // 事件
    powerBtn.addEventListener('click', togglePower);
    nextSceneBtn.addEventListener('click', nextScene);
    prevSceneBtn.addEventListener('click', prevScene);
    autoBtn.addEventListener('click', toggleAutoPlay);
    menuBtn.addEventListener('click', () => { menuOverlay.style.display = 'flex'; stopAutoPlay(); });
    closeMenuBtn.addEventListener('click', closeMenu);

    // 屏幕点击推进
    document.addEventListener('click', function(e) {
        if (e.target.closest('#cover-screen')) return;
        if (e.target.closest('.game-overlay')) return;
        if (e.target.closest('.tv-button')) return;
        if (e.target.closest('.menu-content')) return;
        if (e.target.closest('.chapter-display')) return;
        if (e.target.closest('.bgm-toggle-btn')) return;
        if (!isPoweredOn) return;
        if (e.target.closest('.tv-screen') || e.target.closest('.tv-frame')) {
            if (chapterDisplay.classList.contains('active')) return;
            nextScene();
        }
    });

    tower.addEventListener('click', function(e) {
        e.stopPropagation();
        flashTowerLight();
        showNotification("航空警示灯闪烁中...");
    });

    textSpeedSlider.addEventListener('input', function() { textSpeed = parseInt(this.value); });
    autoSpeedSlider.addEventListener('input', function() { if (isAutoPlaying) restartAutoPlay(); });
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    resetBtn.addEventListener('click', resetProgress);

    // BGM浮动按钮
    const bgmToggleBtn = document.getElementById('bgm-toggle-btn');
    if (bgmToggleBtn) {
        bgmToggleBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            AudioManager.toggleBGM();
        });
    }

    // 语音开关
    const voiceToggle = document.getElementById('voice-toggle');
    const voiceToggleLabel = document.getElementById('voice-toggle-label');
    if (voiceToggle) {
        voiceToggle.addEventListener('change', function() {
            AudioManager.setVoiceEnabled(this.checked);
            if (voiceToggleLabel) voiceToggleLabel.textContent = this.checked ? '开启' : '关闭';
        });
    }

    // 音量滑块
    const voiceVolumeSlider = document.getElementById('voice-volume');
    const voiceVolumeValue = document.getElementById('voice-volume-value');
    if (voiceVolumeSlider) {
        voiceVolumeSlider.addEventListener('input', function() {
            const vol = this.value / 100;
            AudioManager.setVoiceVolume(vol);
            if (voiceVolumeValue) voiceVolumeValue.textContent = this.value + '%';
        });
    }

    const bgmVolumeSlider = document.getElementById('bgm-volume');
    const bgmVolumeValue = document.getElementById('bgm-volume-value');
    if (bgmVolumeSlider) {
        bgmVolumeSlider.addEventListener('input', function() {
            const vol = this.value / 100;
            AudioManager.setBGMVolume(vol);
            if (bgmVolumeValue) bgmVolumeValue.textContent = this.value + '%';
        });
    }

    function getChapterForScene(sceneIndex) {
        for (let i = 0; i < chapters.length; i++) {
            if (sceneIndex >= chapters[i].sceneStart && sceneIndex <= chapters[i].sceneEnd) return i;
        }
        return 0;
    }

    function showChapterTitle(chapterIndex) {
        const chapter = chapters[chapterIndex];
        chapterTitle.textContent = chapter.title;
        chapterDescription.textContent = chapter.description;
        chapterYear.textContent = chapter.year;
        chapterCurrent.textContent = chapterIndex + 1;
        chapterTotal.textContent = chapters.length;
        chapterTitle.classList.add('chapter-glow');
        chapterDisplay.classList.add('active');
        if (isAutoPlaying) stopAutoPlay();

        // 章节切换时处理BGM
        if (chapterIndex === 5) {
            AudioManager.playBGM('guilai');
        } else {
            AudioManager.restartBGM();
        }

        const handler = function(e) {
            e.stopPropagation();
            chapterDisplay.classList.remove('active');
            chapterTitle.classList.remove('chapter-glow');
            chapterDisplay.removeEventListener('click', handler);
            if (isAutoPlaying) startAutoPlay();
        };
        chapterDisplay.addEventListener('click', handler);
    }

    function updateScene() {
        if (!isPoweredOn) {
            sceneBg.style.background = '#000';
            speakerEl.textContent = '';
            dialogueTextEl.textContent = '电源已关闭';
            characterLeftImg.src = '';
            characterRightImg.src = '';
            return;
        }

        const newChapterIndex = getChapterForScene(currentSceneIndex);
        const isNewChapter = newChapterIndex !== currentChapterIndex;
        currentChapterIndex = newChapterIndex;

        const chapter = chapters[currentChapterIndex];
        currentSceneInChapterIndex = currentSceneIndex - chapter.sceneStart;

        if (isNewChapter) showChapterTitle(currentChapterIndex);

        const scene = scenes[currentSceneIndex];
        const newBgKey = scene.background || 'hillside';
        const newBg = backgrounds[newBgKey];
        if (currentBackground !== newBgKey) {
            currentBackground = newBgKey;
            sceneBg.style.background = newBg;
            sceneBg.classList.remove('background-crossfade');
            void sceneBg.offsetWidth;
            sceneBg.classList.add('background-crossfade');
            setTimeout(() => sceneBg.classList.remove('background-crossfade'), 1500);
        } else {
            sceneBg.style.background = newBg;
        }

        speakerEl.textContent = scene.speaker;
        characterLeft.classList.toggle('is-speaking', Boolean(scene.characterLeft) && scene.speaker === '林远');
        characterRight.classList.toggle('is-speaking', Boolean(scene.characterRight) && scene.speaker === '老周');
        characterLeft.classList.toggle('is-muted', Boolean(scene.characterLeft) && scene.speaker !== '林远' && scene.speaker !== '旁白');
        characterRight.classList.toggle('is-muted', Boolean(scene.characterRight) && scene.speaker !== '老周' && scene.speaker !== '旁白');

        typewriterEffect(scene.text);
        AudioManager.playVoice(scene.id, scene.speaker, scene.characterLeft);
        setCharacterImage(characterLeftImg, scene.characterLeft);
        setCharacterImage(characterRightImg, scene.characterRight);

        const charLeftChanged = scene.characterLeft !== currentCharLeft;
        const charRightChanged = scene.characterRight !== currentCharRight;
        currentCharLeft = scene.characterLeft || '';
        currentCharRight = scene.characterRight || '';

        if (scene.characterLeft && charLeftChanged) {
            characterLeft.classList.remove('character-enter-left');
            void characterLeft.offsetWidth;
            characterLeft.classList.add('character-enter-left');
        }
        if (scene.characterRight && charRightChanged) {
            characterRight.classList.remove('character-enter-right');
            void characterRight.offsetWidth;
            characterRight.classList.add('character-enter-right');
        }

        tower.style.display = scene.interactive === 'tower' ? 'block' : 'none';

        document.title = `我们之间 · 第${currentChapterIndex + 1}章 第${currentSceneInChapterIndex + 1}幕`;
        checkGameTrigger(currentSceneIndex);
    }

    function typewriterEffect(text) {
        if (typewriterTimeout) { clearTimeout(typewriterTimeout); typewriterTimeout = null; }
        const speed = 100 - (textSpeed * 10);
        dialogueTextEl.textContent = '';
        let i = 0;
        function type() {
            if (i < text.length) {
                dialogueTextEl.textContent += text.charAt(i);
                i++;
                typewriterTimeout = setTimeout(type, speed);
            } else {
                typewriterTimeout = null;
            }
        }
        type();
    }

    function togglePower() {
        isPoweredOn = !isPoweredOn;
        const screen = document.getElementById('tv-screen');
        if (isPoweredOn) {
            screen.classList.add('power-on-effect');
            setTimeout(() => screen.classList.remove('power-on-effect'), 800);
        } else {
            screen.classList.add('power-off-effect');
            setTimeout(() => screen.classList.remove('power-off-effect'), 500);
            if (isAutoPlaying) toggleAutoPlay();
            AudioManager.stopVoice();
        }
        updateScene();
    }

    function nextScene() {
        if (!isPoweredOn) return;
        if (currentSceneIndex < scenes.length - 1) {
            const nextData = scenes[currentSceneIndex + 1];
            const bgChanged = (nextData.background || 'hillside') !== currentBackground;
            currentSceneIndex++;
            updateScene();
            if (bgChanged) playSceneTransition();
        } else {
            showEnding();
        }
    }

    function prevScene() {
        if (!isPoweredOn) return;
        if (currentSceneIndex > 0) {
            const prevData = scenes[currentSceneIndex - 1];
            const bgChanged = (prevData.background || 'hillside') !== currentBackground;
            currentSceneIndex--;
            updateScene();
            if (bgChanged) playSceneTransition();
        } else {
            showNotification("已经是第一幕了");
        }
    }

    function toggleAutoPlay() {
        isAutoPlaying = !isAutoPlaying;
        if (isAutoPlaying) {
            autoBtn.classList.add('active-state');
            startAutoPlay();
            showNotification("自动播放已开启");
        } else {
            autoBtn.classList.remove('active-state');
            stopAutoPlay();
            showNotification("自动播放已关闭");
        }
    }

    function startAutoPlay() {
        const interval = 3000 - (autoSpeedSlider.value * 200);
        stopAutoPlay();
        function autoAdvance() {
            if (!isAutoPlaying) return;
            if (AudioManager.isVoicePlaying()) {
                autoPlayInterval = setTimeout(autoAdvance, 500);
            } else {
                nextScene();
                autoPlayInterval = setTimeout(autoAdvance, interval);
            }
        }
        autoPlayInterval = setTimeout(autoAdvance, interval);
    }

    function stopAutoPlay() {
        if (autoPlayInterval) { clearInterval(autoPlayInterval); autoPlayInterval = null; }
    }

    function restartAutoPlay() {
        if (isAutoPlaying) { stopAutoPlay(); startAutoPlay(); }
    }

    function playSceneTransition() {
        const screen = document.getElementById('tv-screen');
        screen.classList.add('scene-change');
        setTimeout(() => screen.classList.remove('scene-change'), 1100);
    }

    function flashTowerLight() {
        const light = document.querySelector('.tower-light');
        if (!light) return;
        light.style.animation = 'none';
        setTimeout(() => { light.style.animation = 'lightFlash 0.5s infinite'; }, 10);
    }

    function closeMenu() {
        menuOverlay.style.display = 'none';
        if (isAutoPlaying) startAutoPlay();
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen();
        }
    }

    function resetProgress() {
        currentSceneIndex = 0;
        updateScene();
        showNotification("进度已重置");
        closeMenu();
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position:fixed;top:20px;right:20px;z-index:1000;
            background:rgba(0,0,0,0.9);color:#f2c879;
            border:1px solid rgba(216,154,74,0.5);border-radius:4px;
            padding:10px 20px;font-size:12px;letter-spacing:0.05em;
            font-family:'DotGothic16','ZCOOL QingKe HuangYou',monospace;
            animation:fadeInOutNotif 3s ease forwards;
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    // ===== 故事结局 =====
    function showEnding() {
        if (isAutoPlaying) stopAutoPlay();
        gameOverlay.classList.add('active');
        gameContainer.innerHTML = `
            <div class="ending-screen">
                <div class="ending-screen-bg"><img src="images/story_ending.png" alt="归途" loading="lazy"></div>
                <div class="ending-screen-overlay"></div>
                <div class="ending-screen-content">
                    <div class="ending-badge">完</div>
                    <div class="ending-title">终章 · 归途</div>
                    <div class="ending-subtitle">— 全文完 —</div>
                    <div class="ending-screen-divider"></div>
                    <div class="ending-core-quote">"我觉得它不是把人送走的。是把人叫回来的。"</div>
                    <div class="ending-author-line">—— 林远，《我们之间》</div>
                    <div class="ending-screen-divider"></div>
                    <div class="ending-screen-actions">
                        <button class="ending-screen-btn primary" id="ending-restart-btn"><i class="fas fa-book-open"></i> 重新阅读</button>
                        <button class="ending-screen-btn" id="ending-top-btn"><i class="fas fa-arrow-up"></i> 回到顶部</button>
                    </div>
                </div>
            </div>`;
        gameSkipBtn.style.display = 'none';
        gameRestartBtn.style.display = 'none';
        document.getElementById('ending-restart-btn').onclick = () => {
            gameOverlay.classList.remove('active');
            gameContainer.innerHTML = '';
            currentGame = null;
            currentSceneIndex = 0;
            updateScene();
            showNotification('重新开始故事');
            document.getElementById('novel').scrollIntoView({ behavior: 'smooth' });
        };
        document.getElementById('ending-top-btn').onclick = () => {
            gameOverlay.classList.remove('active');
            gameContainer.innerHTML = '';
            currentGame = null;
            gameState = {};
            document.getElementById('hero').scrollIntoView({ behavior: 'smooth' });
        };
    }

    // ===== 游戏系统 =====
    const gameOverlay = document.getElementById('game-overlay');
    const gameContainer = document.getElementById('game-container');
    const gameSkipBtn = document.getElementById('game-skip-btn');
    const gameRestartBtn = document.getElementById('game-restart-btn');
    let currentGame = null;
    let gameState = {};
    let gameTimer = null;

    const gameConfig = {
        'lamp-counting': { triggerScene: 10, duration: 15000 },
        'tower-inspection': { triggerScene: 15, duration: 30000 },
        'wire-connection': { triggerScene: 32, duration: 45000 },
        'village-change': { triggerScene: 55, duration: 40000 },
        'bolt-correction': { triggerScene: 77, duration: 25000 },
    };

    function checkGameTrigger(sceneIndex) {
        for (const [gameId, config] of Object.entries(gameConfig)) {
            if (sceneIndex === config.triggerScene) {
                setTimeout(() => startGame(gameId), 1000);
                return;
            }
        }
    }

    function startGame(gameId) {
        currentGame = gameId;
        gameState = {};
        if (isAutoPlaying) stopAutoPlay();
        gameOverlay.classList.add('active');
        gameSkipBtn.style.display = '';
        gameRestartBtn.style.display = '';
        switch (gameId) {
            case 'lamp-counting': initLampCountingGame(); break;
            case 'tower-inspection': initTowerInspectionGame(); break;
            case 'wire-connection': initWireConnectionGame(); break;
            case 'village-change': initVillageChangeGame(); break;
            case 'bolt-correction': initBoltCorrectionGame(); break;
        }
        gameSkipBtn.onclick = () => endGame(false);
        gameRestartBtn.onclick = () => startGame(gameId);
    }

    function bindContinueStoryButton() {
        const btn = gameContainer.querySelector('.js-continue-story');
        if (btn) btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); endGame(true); };
    }

    function endGame(completed) {
        if (gameTimer) { clearInterval(gameTimer); gameTimer = null; }
        if (completed) {
            const played = JSON.parse(localStorage.getItem('playedGames') || '[]');
            if (!played.includes(currentGame)) { played.push(currentGame); localStorage.setItem('playedGames', JSON.stringify(played)); }
        }
        gameOverlay.classList.remove('active');
        gameContainer.innerHTML = '';
        currentGame = null;
        gameState = {};
        if (isAutoPlaying) startAutoPlay();
        showNotification(completed ? '游戏完成！继续故事吧' : '游戏已跳过');
    }

    // 航空灯计数游戏
    function initLampCountingGame() {
        gameState = { count: 0, timeLeft: 15, flashInterval: null };
        gameContainer.innerHTML = `
            <div class="lamp-counting-game">
                <div class="game-score">计数: <span id="lamp-count">0</span></div>
                <div class="game-timer">时间: <span id="lamp-timer">15</span>秒</div>
                <div class="game-instructions">林远问：那它一晚上闪多少下？<br>在15秒内点击闪烁的灯来计数！</div>
                <div class="tower-display"><div class="tower-pixel-art"></div><div class="lamp-display" id="lamp-display"></div></div>
                <div class="click-area" id="lamp-click-area"></div>
            </div>`;
        const lampDisplay = document.getElementById('lamp-display');
        const clickArea = document.getElementById('lamp-click-area');
        const countDisplay = document.getElementById('lamp-count');
        const timerDisplay = document.getElementById('lamp-timer');
        gameState.flashInterval = setInterval(() => {
            lampDisplay.style.animation = 'none';
            setTimeout(() => { lampDisplay.style.animation = 'lampFlash 0.5s ease'; }, 10);
        }, 1000);
        clickArea.onclick = () => {
            if (gameState.timeLeft > 0) {
                gameState.count++;
                countDisplay.textContent = gameState.count;
                lampDisplay.style.transform = 'scale(1.3)';
                setTimeout(() => { lampDisplay.style.transform = 'scale(1)'; }, 100);
            }
        };
        gameTimer = setInterval(() => {
            gameState.timeLeft--;
            timerDisplay.textContent = gameState.timeLeft;
            if (gameState.timeLeft <= 0) {
                clearInterval(gameTimer);
                clearInterval(gameState.flashInterval);
                showLampResult();
            }
        }, 1000);
    }

    function showLampResult() {
        const r = gameState.count;
        const msg = r >= 30 ? '太厉害了！' : r >= 20 ? '不错！' : r >= 10 ? '继续加油！' : '再试一次！';
        gameContainer.innerHTML += `<div class="game-complete"><div class="game-feedback-img"><img src="images/feedback_lamp_counting.png" alt="夜空下的输电塔" loading="lazy"></div><h3>游戏结束</h3><p>你数了 ${r} 下！<br>${msg}</p><button class="game-complete-btn js-continue-story">继续故事</button></div>`;
        bindContinueStoryButton();
    }

    // 电塔巡检游戏
    function initTowerInspectionGame() {
        gameState = { defects: [
            { id:1, x:30, y:20, found:false, desc:'螺栓松动' },
            { id:2, x:70, y:40, found:false, desc:'塔材生锈' },
            { id:3, x:50, y:60, found:false, desc:'接地线断裂' },
            { id:4, x:20, y:80, found:false, desc:'绝缘子破损' },
        ], foundCount: 0 };
        gameContainer.innerHTML = `
            <div class="inspection-game">
                <div class="defect-count">已发现: <span id="defect-found">0</span> / ${gameState.defects.length}</div>
                <div class="tower-inspection"><div class="tower-image" id="tower-image"></div></div>
                <div class="game-instructions">检查电塔上的问题，点击发现的缺陷</div>
            </div>`;
        const towerImage = document.getElementById('tower-image');
        gameState.defects.forEach(d => {
            const el = document.createElement('div');
            el.className = 'defect';
            el.style.left = d.x + '%';
            el.style.top = d.y + '%';
            el.title = d.desc;
            el.onclick = (e) => {
                e.stopPropagation();
                if (!d.found) {
                    d.found = true;
                    el.classList.add('found');
                    gameState.foundCount++;
                    document.getElementById('defect-found').textContent = gameState.foundCount;
                    if (gameState.foundCount === gameState.defects.length) setTimeout(showInspectionResult, 500);
                }
            };
            towerImage.appendChild(el);
        });
    }

    function showInspectionResult() {
        gameContainer.innerHTML += `<div class="game-complete"><div class="game-feedback-img"><img src="images/feedback_inspection.png" alt="稳固的输电塔" loading="lazy"></div><h3>巡检完成</h3><p>你发现了所有 ${gameState.defects.length} 个问题！<br>电塔已全面检修完毕</p><button class="game-complete-btn js-continue-story">继续故事</button></div>`;
        bindContinueStoryButton();
    }

    // 连线游戏
    function initWireConnectionGame() {
        gameState = {
            points: [
                { id:1, x:10, y:30, type:'tower', label:'1号塔' },
                { id:2, x:30, y:20, type:'tower', label:'2号塔' },
                { id:3, x:50, y:40, type:'tower', label:'3号塔' },
                { id:4, x:70, y:30, type:'tower', label:'4号塔' },
                { id:5, x:90, y:50, type:'substation', label:'变电站' },
            ],
            connections: [], currentStep: 1, lastPoint: null,
        };
        gameContainer.innerHTML = `
            <div class="wire-game">
                <div class="game-instructions">按顺序连接电塔到变电站</div>
                <div class="wire-progress" id="wire-progress">请点击 1号塔</div>
                <div class="wire-canvas" id="wire-canvas">
                    <svg class="wire-lines" id="wire-lines" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
                </div>
            </div>`;
        const wireCanvas = document.getElementById('wire-canvas');
        const progressEl = document.getElementById('wire-progress');
        gameState.points.forEach(p => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `wire-point ${p.type}`;
            btn.id = `point-${p.id}`;
            btn.style.left = p.x + '%';
            btn.style.top = p.y + '%';
            btn.setAttribute('aria-label', p.label);
            btn.innerHTML = `<span>${p.id === 5 ? '站' : p.id}</span>`;
            btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); handleWireClick(p, btn, progressEl); };
            wireCanvas.appendChild(btn);
        });
        updateWireStates();
    }

    function handleWireClick(point, btn, progressEl) {
        if (point.id !== gameState.currentStep) {
            btn.classList.add('wrong');
            showNotification(`请先连接 ${gameState.currentStep === 5 ? '变电站' : gameState.currentStep + '号塔'}`);
            setTimeout(() => btn.classList.remove('wrong'), 380);
            return;
        }
        btn.classList.add('connected');
        if (gameState.lastPoint) {
            gameState.connections.push({ from: gameState.lastPoint.id, to: point.id });
            drawWire(gameState.lastPoint, point);
        }
        gameState.lastPoint = point;
        gameState.currentStep++;
        if (gameState.currentStep > gameState.points.length) {
            progressEl.textContent = '线路已成功接入变电站';
            setTimeout(showWireResult, 500);
            return;
        }
        const next = gameState.points.find(p => p.id === gameState.currentStep);
        progressEl.textContent = `下一步：点击 ${next.label}`;
        updateWireStates();
    }

    function updateWireStates() {
        gameState.points.forEach(p => {
            const el = document.getElementById(`point-${p.id}`);
            if (!el) return;
            el.classList.toggle('available', p.id === gameState.currentStep);
            el.disabled = p.id < gameState.currentStep;
        });
    }

    function drawWire(from, to) {
        const svg = document.getElementById('wire-lines');
        if (!svg) return;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', from.x);
        line.setAttribute('y1', from.y);
        line.setAttribute('x2', to.x);
        line.setAttribute('y2', to.y);
        line.classList.add('wire-line');
        svg.appendChild(line);
    }

    function showWireResult() {
        gameContainer.innerHTML += `<div class="game-complete"><div class="game-feedback-img"><img src="images/feedback_wire_connection.png" alt="灯火通明的村庄" loading="lazy"></div><h3>线路连接成功</h3><p>电送到了！<br>村庄的每一扇窗户都亮起了温暖的灯光</p><button class="game-complete-btn js-continue-story">继续故事</button></div>`;
        bindContinueStoryButton();
    }

    // 村庄变化游戏
    function initVillageChangeGame() {
        gameState = { changes: [
            { id:1, x:20, y:30, found:false, desc:'烂路变成水泥路' },
            { id:2, x:60, y:50, found:false, desc:'安装了太阳能路灯' },
            { id:3, x:40, y:70, found:false, desc:'花生地改种柑橘苗' },
            { id:4, x:80, y:40, found:false, desc:'立了采摘园牌子' },
        ], foundCount: 0 };
        gameContainer.innerHTML = `
            <div class="change-game">
                <div class="change-count">已发现: <span id="change-found">0</span> / ${gameState.changes.length}</div>
                <div class="change-comparison">
                    <div class="change-before"><div class="change-label">2017年</div></div>
                    <div class="change-after"><div class="change-label">2021年</div><div id="after-spots"></div></div>
                </div>
                <div class="game-instructions">找出2017年到2021年村庄的变化</div>
            </div>`;
        const afterSpots = document.getElementById('after-spots');
        gameState.changes.forEach(c => {
            const el = document.createElement('div');
            el.className = 'change-spot';
            el.style.left = c.x + '%';
            el.style.top = c.y + '%';
            el.title = c.desc;
            el.onclick = (e) => {
                e.stopPropagation();
                if (!c.found) {
                    c.found = true;
                    el.classList.add('found');
                    gameState.foundCount++;
                    document.getElementById('change-found').textContent = gameState.foundCount;
                    showNotification(c.desc);
                    if (gameState.foundCount === gameState.changes.length) setTimeout(showChangeResult, 1000);
                }
            };
            afterSpots.appendChild(el);
        });
    }

    function showChangeResult() {
        gameContainer.innerHTML += `<div class="game-complete"><div class="game-feedback-img"><img src="images/feedback_village_change.png" alt="繁荣的旧仓村" loading="lazy"></div><h3>变化发现完成</h3><p>你发现了所有 ${gameState.changes.length} 个变化！<br>村子正在变得越来越好</p><button class="game-complete-btn js-continue-story">继续故事</button></div>`;
        bindContinueStoryButton();
    }

    // 螺栓纠错游戏
    function initBoltCorrectionGame() {
        gameState = { bolts: [
            { id:1, x:20, y:30, label:'M20', correct:false },
            { id:2, x:40, y:50, label:'M24', correct:true },
            { id:3, x:60, y:30, label:'M20', correct:false },
            { id:4, x:80, y:50, label:'M24', correct:true },
        ], correctedCount: 0 };
        gameContainer.innerHTML = `
            <div class="bolt-game">
                <div class="bolt-instructions">林远画的草图中有错误<br>找出规格错误的螺栓并点击修正</div>
                <div class="bolt-diagram" id="bolt-diagram"></div>
            </div>`;
        const boltDiagram = document.getElementById('bolt-diagram');
        gameState.bolts.forEach(b => {
            const el = document.createElement('div');
            el.className = `bolt-item ${b.correct ? 'correct' : 'incorrect'}`;
            el.style.left = b.x + '%';
            el.style.top = b.y + '%';
            const lbl = document.createElement('span');
            lbl.className = 'bolt-label';
            lbl.textContent = b.label;
            el.appendChild(lbl);
            el.onclick = (e) => {
                e.stopPropagation();
                if (!b.correct) {
                    b.correct = true;
                    el.classList.remove('incorrect');
                    el.classList.add('correct');
                    lbl.textContent = 'M24';
                    gameState.correctedCount++;
                    if (gameState.bolts.every(b => b.correct)) setTimeout(showBoltResult, 500);
                }
            };
            boltDiagram.appendChild(el);
        });
    }

    function showBoltResult() {
        gameContainer.innerHTML += `<div class="game-complete"><div class="game-feedback-img"><img src="images/feedback_bolt_correction.png" alt="手绘草图上的螺栓标注" loading="lazy"></div><h3>纠错完成</h3><p>第九基的螺栓规格写错了。<br>M24，不是M20。现在改过来了。</p><button class="game-complete-btn js-continue-story">继续故事</button></div>`;
        bindContinueStoryButton();
    }

    // 重置游戏进度按钮
    const resetGameBtn = document.createElement('button');
    resetGameBtn.innerHTML = '<i class="fas fa-gamepad"></i> 重置游戏进度';
    resetGameBtn.style.cssText = 'width:100%;margin-top:10px;padding:12px;border-radius:3px;border:3px solid #17100c;outline:2px solid rgba(216,154,74,0.58);background:linear-gradient(180deg,#6d5b49 0%,#39302a 48%,#1b1816 49%,#111 100%);color:#f3dfba;font-family:"DotGothic16","ZCOOL QingKe HuangYou",monospace;cursor:pointer;text-shadow:2px 2px 0 #000;box-shadow:0 4px 0 #090909,inset 0 2px 0 rgba(255,238,190,0.2);';
    resetGameBtn.onclick = () => { localStorage.removeItem('playedGames'); showNotification('游戏进度已重置'); };
    document.querySelector('.menu-section:last-of-type')?.appendChild(resetGameBtn);

    // ===== 初始化所有模块 =====
    function initAll() {
        initAudioOnInteraction();
        preloadImages();
        createStars();
        initParticles();
        animateParticles();
        setupScrollAnimations();
        setupTimeline();
        setupGallery();
        setupEndingParticles();
    }

    // ===== 手机端横屏适配 =====
    const portraitOverlay = document.getElementById('portrait-overlay');
    const landscapeBtn = document.getElementById('landscape-btn');
    const portraitForceBtn = document.getElementById('portrait-force-btn');
    const portraitText = document.getElementById('portrait-text');
    const portraitSub = document.getElementById('portrait-sub');
    const portraitExit = document.getElementById('portrait-exit');

    function isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            || (window.innerWidth <= 768 && ('ontouchstart' in window));
    }

    function isWeixin() {
        return /MicroMessenger/i.test(navigator.userAgent);
    }

    function isPortrait() {
        // 若启用了 CSS 强制横屏，一律视为横屏
        if (document.body.classList.contains('css-force-landscape')) return false;
        const angle = window.screen.orientation ? window.screen.orientation.angle : window.orientation;
        return angle === 0 || angle === 180;
    }

    function isOrientationLockSupported() {
        return !!(screen.orientation && screen.orientation.lock);
    }

    async function requestFullscreenLandscape() {
        // 如果已经处于 CSS 强制横屏，点击则退出
        if (document.body.classList.contains('css-force-landscape')) {
            document.body.classList.remove('css-force-landscape');
            updatePortraitOverlay();
            return;
        }

        const el = document.documentElement;
        try {
            if (el.requestFullscreen) await el.requestFullscreen();
            else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
            else if (el.msRequestFullscreen) await el.msRequestFullscreen();
        } catch (e) {}

        let locked = false;
        try {
            if (screen.orientation && screen.orientation.lock) {
                await screen.orientation.lock('landscape');
                locked = true;
            }
        } catch (e) {}

        // 标准 API 失败（如微信），退回到 CSS 旋转模拟横屏
        if (!locked) {
            document.body.classList.add('css-force-landscape');
            updatePortraitOverlay();
        }
    }

    function updatePortraitOverlay() {
        if (!isMobile()) {
            if (portraitOverlay) portraitOverlay.classList.remove('active');
            return;
        }

        // 微信环境：调整提示文案
        if (isWeixin() && portraitText && portraitSub) {
            portraitText.textContent = '微信内请使用下方按钮进入横屏';
            portraitSub.textContent = '以获得最佳阅读体验';
        }

        // 若启用了 CSS 强制横屏，隐藏遮罩并显示退出提示
        if (document.body.classList.contains('css-force-landscape')) {
            if (portraitOverlay) portraitOverlay.classList.remove('active');
            if (portraitExit) portraitExit.style.display = 'block';
            if (portraitForceBtn) {
                portraitForceBtn.innerHTML = '<i class="fas fa-compress"></i> 退出横屏模式';
            }
            return;
        }

        // 未启用强制横屏时恢复按钮文字
        if (portraitForceBtn) {
            portraitForceBtn.innerHTML = '<i class="fas fa-expand"></i> 强制横屏模式';
        }
        if (portraitExit) portraitExit.style.display = 'none';

        if (isPortrait()) {
            if (portraitOverlay) portraitOverlay.classList.add('active');
        } else {
            if (portraitOverlay) portraitOverlay.classList.remove('active');
        }
    }

    if (landscapeBtn) {
        landscapeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            requestFullscreenLandscape();
        });
    }

    if (portraitForceBtn) {
        portraitForceBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            requestFullscreenLandscape();
        });
    }

    window.addEventListener('orientationchange', updatePortraitOverlay);
    window.addEventListener('resize', updatePortraitOverlay);
    updatePortraitOverlay();

    // 通知动画样式
    const notifStyle = document.createElement('style');
    notifStyle.textContent = `
        @keyframes fadeInOutNotif {
            0% { opacity:0; transform:translateY(-10px); }
            20% { opacity:1; transform:translateY(0); }
            80% { opacity:1; transform:translateY(0); }
            100% { opacity:0; transform:translateY(-10px); }
        }
        .background-crossfade { animation: backgroundCrossfade 1.5s ease forwards; }
        @keyframes backgroundCrossfade { 0% { opacity:0; } 100% { opacity:1; } }
    `;
    document.head.appendChild(notifStyle);
});
