/**
 * FFVoid (虚空造物) - Core Website Application Logic
 * Handles i18n bilingual switching, Spotify discography rendering, player modal, and interactions
 */

(function () {
    'use strict';

    // =========================================================================
    // 1. Bilingual Dictionary (i18n)
    // =========================================================================
    const I18N = {
        en: {
            navHome: 'Home',
            navMusic: 'Discography',
            navVision: 'Why Dreamy Voyage',
            navContact: 'Contact',
            badgeArtist: 'OFFICIAL ARTIST PROFILE',
            artistName: 'FFVoid',
            artistSubname: '虚空造物',
            heroTagline: 'Forging acoustic realities from the infinite void. Atmospheric soundscapes, cyberpunk rhythms, and ethereal synth journeys.',
            heroExploreBtn: 'Explore Discography',
            heroSpotifyBtn: 'Listen on Spotify',
            statAlbums: 'Albums Released',
            statFrequency: 'Infinite Void Audio',
            statPlatform: 'Streaming on Spotify',
            musicSectionTitle: 'Discography',
            musicSectionSub: 'Complete catalog of official albums streaming worldwide on Spotify.',
            filterAll: 'All Works',
            filterDreamy: 'Dreamy Voyage Series',
            filterGameon: 'Gameon Series',
            btnListenSpotify: 'Spotify Page',
            btnQuickPreview: 'Stream Preview',
            manifestoBadge: 'ALBUM ESSAY · 创作手记',
            manifestoTitle: 'Why Dreamy Voyage',
            manifestoLead: 'Life carries an odd fragility, like a waking dream that slips through our fingers while we are busy keeping up with the world. In the rush of daily demands and ambient static, it is quiet and sudden how we lose touch with the people we intended to become.',
            manifestoWhy: 'That quiet drift is why Dreamy Voyage exists.',
            manifestoP1: 'The raw melodies begin with AI, so I think of myself not as a maker, but as someone listening for echoes in the fog. Out of countless wandering frequencies, I keep only what speaks directly to the chest—because what truly matters is the door this music might leave unlocked for you.',
            manifestoQuote: '"Out of countless wandering frequencies, I keep only what speaks directly to the chest—because what truly matters is the door this music might leave unlocked for you."',
            manifestoP2: 'I hope these tracks feel like stepping into zero gravity. The textures are hazy and slow, built to soften the edge of the day and let the room expand around you. When the background noise dims and the defenses quiet down, the things you set aside—early promises, half-remembered hopes, the clear light of your original purpose—can drift back into view.',
            manifestoEnding: 'Through all the winding complications of living, may this sound give you a pocket of stillness, and eventually, guide you back to your own shore.',
            manifestoSignature: '— FFVoid (虚空造物) · Echoes in the Fog',
            contactTitle: 'Direct Transmission',
            contactSub: 'For sonic collaborations, licensing inquiries, or echoes from across the void.',
            copyEmailBtn: 'Copy Address',
            emailCopiedToast: 'Copied to clipboard: echos@dreamy.voyage',
            closeModal: 'Close Player',
            nowPlaying: 'Now Streaming via Spotify',
            footerRights: 'All Rights Reserved. Sculpted in the Void.',
            footerPowered: 'Edge hosted on Cloudflare Pages.'
        },
        zh: {
            navHome: '首页',
            navMusic: '音乐专辑',
            navVision: '创作手记',
            navContact: '联系',
            badgeArtist: '官方音乐主页',
            artistName: '虚空造物',
            artistSubname: 'FFVoid',
            heroTagline: '于无界虚空之中雕琢声学实体。沉浸式宇宙氛围、赛博脉冲节奏与缥缈梦境合成器之旅。',
            heroExploreBtn: '探索音乐专辑',
            heroSpotifyBtn: '前往 Spotify',
            statAlbums: '已发布专辑',
            statFrequency: '无界虚空音频',
            statPlatform: 'Spotify 全球收听',
            musicSectionTitle: '音乐作品',
            musicSectionSub: '收录虚空造物在 Spotify 全球发行的全部官方原创专辑。',
            filterAll: '全部作品',
            filterDreamy: '幻梦之旅系列',
            filterGameon: 'Gameon 系列',
            btnListenSpotify: 'Spotify 专页',
            btnQuickPreview: '嵌入式试听',
            manifestoBadge: 'ALBUM ESSAY · 创作手记',
            manifestoTitle: '关于《Dreamy Voyage》',
            manifestoLead: '生活常有一种抓不住的虚幻感，像一场半梦半醒的跋涉；当我们忙着应对人间的规则与催促，不知不觉间，就与最初想要成为的自己走散了。',
            manifestoWhy: '这种无声的游离，是我整理《Dreamy Voyage》的由头。',
            manifestoP1: '这些原始音符由 AI 唤起，因此我并不称自己为作者，更像是在漫天雾气里静候回音的人。在无尽的声音散落中，我只留下真正能撞击胸口的那几缕声线——因为于我而言，最要紧的是这些旋律能否为你推开一扇向内看的门。',
            manifestoQuote: '“在无尽的声音散落中，我只留下真正能撞击胸口的那几缕声线——因为于我而言，最要紧的是这些旋律能否为你推开一扇向内看的门。”',
            manifestoP2: '我愿这些音乐能带给你几分失重的松弛。那些幽微、迷离的氛围音色，是为了抚平日常里紧绷的棱角，让思绪有处安放。当身边的喧嚣慢慢退潮，戒备悄然瓦解，那些曾被你暂时搁置的誓言、模糊的梦想，以及心底最清澈的初衷，才得以重新浮现。',
            manifestoEnding: '穿透这芜杂而漫长的人间，愿这一程梦境能赠你片刻安宁，最终，载你抵达自己心灵的岸。',
            manifestoSignature: '—— 虚空造物（FFVoid）· 雾里听音',
            contactTitle: '虚空信标',
            contactSub: '关于音乐合作、商用授权或跨越维度的灵感交流。',
            copyEmailBtn: '一键复制',
            emailCopiedToast: '已复制邮箱至剪贴板：echos@dreamy.voyage',
            closeModal: '关闭播放器',
            nowPlaying: '正在通过 Spotify 嵌入播放',
            footerRights: '版权所有 · 于虚空中铸就。',
            footerPowered: '基于 Cloudflare Pages 全球边缘网络托管。'
        }
    };

    // =========================================================================
    // 2. State & Discography Data
    // =========================================================================
    let currentLang = localStorage.getItem('ffvoid_lang') || 'en';
    let albumsData = [];

    // Fallback data if albums.json fails to load
    const FALLBACK_ALBUMS = [
        {
            id: '7AHHnrbr9gBBl6s2cIuvc3',
            title: 'Dreamy.Voyage: Prime 5',
            titleZh: '幻梦之旅：Prime 5',
            series: 'dreamy',
            releaseDate: '2026-09-07',
            type: 'Studio Album',
            typeZh: '录音室专辑',
            trackCount: 18,
            genre: 'Cyber Ambient / Future Beats',
            genreZh: '赛博氛围 / 未来节奏',
            descriptionEn: 'A transcendent auditory voyage through cyberspace and dimensional rifts. The pinnacle milestone of the Prime series.',
            descriptionZh: '穿透赛博空间与虚空维度的巅峰听觉航行，Prime 旗舰系列的终极篇章。',
            spotifyUrl: 'https://open.spotify.com/album/7AHHnrbr9gBBl6s2cIuvc3',
            localCover: 'assets/covers/prime-5.jpg',
            coverUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e0297f3bc46c8b472820bc1a487'
        },
        {
            id: '4ZFSObop5fvoL9seQ1CphS',
            title: 'Gameon Album 2',
            titleZh: 'Gameon 专辑 2',
            series: 'gameon',
            releaseDate: '2026-03-02',
            type: 'Original Album',
            typeZh: '原创专辑',
            trackCount: 16,
            genre: 'Electronic / Chiptune / Synthwave',
            genreZh: '电子 / 8-Bit / 合成器波',
            descriptionEn: 'High-octane electronic and gaming soundscapes blending neon retro vibes with modern heavy beats.',
            descriptionZh: '高能游戏与电子原声世界，碰撞复古霓虹街机风与现代激昂鼓点。',
            spotifyUrl: 'https://open.spotify.com/album/4ZFSObop5fvoL9seQ1CphS',
            localCover: 'assets/covers/gameon-2.jpg',
            coverUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e022bad063af99755070ef1a0fa'
        },
        {
            id: '12zSLb0ppHpwFtZyha3hOn',
            title: 'Gameon Album 1',
            titleZh: 'Gameon 专辑 1',
            series: 'gameon',
            releaseDate: '2025-11-10',
            type: 'Original Album',
            typeZh: '原创专辑',
            trackCount: 15,
            genre: 'Cyberpunk / Game OST / Electro',
            genreZh: '赛博朋克 / 游戏原声 / 电子',
            descriptionEn: 'The pioneering installment in the Gameon anthology. Dynamic, exhilarating rhythms crafted for virtual arenas.',
            descriptionZh: 'Gameon 系列的破晓之作，为虚拟竞技场量身构筑的动态燃魂节奏。',
            spotifyUrl: 'https://open.spotify.com/album/12zSLb0ppHpwFtZyha3hOn',
            localCover: 'assets/covers/gameon-1.jpg',
            coverUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02ae9d1ae9158fdc023e025f98'
        },
        {
            id: '5PZ8atoSio9I3XfTgNFSDI',
            title: 'Dreamy Voyage (Album 3)',
            titleZh: '幻梦之旅 (专辑 3)',
            series: 'dreamy',
            releaseDate: '2025-08-23',
            type: 'Studio Album',
            typeZh: '录音室专辑',
            trackCount: 14,
            genre: 'Dream Pop / Ethereal Wave',
            genreZh: '梦幻流行 / 缥缈波',
            descriptionEn: 'Deep diving into subconscious dream realms with delicate pads, floating melodies, and hazy echoes.',
            descriptionZh: '深潜潜意识梦境深处，以温润合成器铺垫与飘渺旋律勾勒夜色幻景。',
            spotifyUrl: 'https://open.spotify.com/album/5PZ8atoSio9I3XfTgNFSDI',
            localCover: 'assets/covers/dreamy-voyage-3.jpg',
            coverUrl: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e020f291b76d59a3d1b4ea3eb78'
        },
        {
            id: '45pbXcOwLbttHzn1oxzyjW',
            title: 'Dreamy Voyage (Album 2)',
            titleZh: '幻梦之旅 (专辑 2)',
            series: 'dreamy',
            releaseDate: '2025-08-22',
            type: 'Studio Album',
            typeZh: '录音室专辑',
            trackCount: 14,
            genre: 'Chillwave / Ambient Electronic',
            genreZh: '低保真浪潮 / 氛围电子',
            descriptionEn: 'Atmospheric sound designs capturing the quiet reverie of starlit nebulae and twilight journeys.',
            descriptionZh: '捕捉繁星云隙与薄暮旅程的静谧冥想，流淌空灵纯粹的沉浸式声场。',
            spotifyUrl: 'https://open.spotify.com/album/45pbXcOwLbttHzn1oxzyjW',
            localCover: 'assets/covers/dreamy-voyage-2.jpg',
            coverUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02104ea40b79d4e8b5ae880a21'
        },
        {
            id: '2aPeqkFWPCRYQuFYB0sSQB',
            title: 'Dreamy Voyage',
            titleZh: '幻梦之旅 (首专)',
            series: 'dreamy',
            releaseDate: '2025-08-18',
            type: 'Debut Album',
            typeZh: '创世首专',
            trackCount: 12,
            genre: 'Ambient / Future Electronic',
            genreZh: '环境氛围 / 原创未来电子',
            descriptionEn: 'The genesis of the Dreamy Voyage universe. Where the void first took acoustic form.',
            descriptionZh: '幻梦之旅宇宙的创世起源之声，虚空造物在此初次赋予虚无以音律。',
            spotifyUrl: 'https://open.spotify.com/album/2aPeqkFWPCRYQuFYB0sSQB',
            localCover: 'assets/covers/dreamy-voyage-1.jpg',
            coverUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02878501f960ceb5e2b3caf1c5'
        }
    ];

    // =========================================================================
    // 3. DOM Elements
    // =========================================================================
    const langToggleBtn = document.getElementById('lang-toggle-btn');
    const albumsGrid = document.getElementById('albums-grid');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const playerModal = document.getElementById('spotify-player-modal');
    const modalIframeContainer = document.getElementById('modal-iframe-wrap');
    const modalAlbumTitle = document.getElementById('modal-album-title');
    const modalCloseBtn = document.getElementById('btn-close-modal');
    const btnCopyEmail = document.getElementById('btn-copy-email');
    const toast = document.getElementById('toast-notification');

    let activeFilter = 'all';

    // =========================================================================
    // 4. Internationalization Logic
    // =========================================================================
    function applyLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('ffvoid_lang', lang);
        document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';

        // Update all elements with data-i18n attribute
        const translatableElements = document.querySelectorAll('[data-i18n]');
        translatableElements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (I18N[lang] && I18N[lang][key]) {
                el.textContent = I18N[lang][key];
            }
        });

        // Update toggle button text
        if (langToggleBtn) {
            langToggleBtn.querySelector('.lang-label').textContent = lang === 'en' ? '中文' : 'EN';
            langToggleBtn.setAttribute('title', lang === 'en' ? '切换为中文' : 'Switch to English');
        }

        // Re-render albums to update localized titles and descriptions
        renderAlbums();
    }

    function toggleLanguage() {
        applyLanguage(currentLang === 'en' ? 'zh' : 'en');
    }

    // =========================================================================
    // 5. Discography Rendering
    // =========================================================================
    function renderAlbums() {
        if (!albumsGrid) return;
        albumsGrid.innerHTML = '';

        const isZh = currentLang === 'zh';
        const filtered = albumsData.filter(album => {
            if (activeFilter === 'all') return true;
            return album.series === activeFilter;
        });

        filtered.forEach((album, idx) => {
            const card = document.createElement('article');
            card.className = 'album-card glass-panel';
            card.style.animationDelay = `${idx * 0.08}s`;

            const displayTitle = isZh ? (album.titleZh || album.title) : album.title;
            const displayType = isZh ? (album.typeZh || album.type) : album.type;
            const displayGenre = isZh ? (album.genreZh || album.genre) : album.genre;
            const displayDesc = isZh ? (album.descriptionZh || album.descriptionEn) : album.descriptionEn;

            const coverSrc = album.localCover || album.coverUrl;

            card.innerHTML = `
                <div class="album-cover-wrap">
                    <img class="album-cover" src="${coverSrc}" alt="${displayTitle}" loading="lazy" onerror="this.src='${album.coverUrl}'" />
                    <div class="album-cover-glow" style="background-image: url('${coverSrc}');"></div>
                    <div class="cover-overlay">
                        <button class="btn-preview-icon" aria-label="${isZh ? '立即试听' : 'Preview Album'}" data-album-id="${album.id}" data-album-title="${displayTitle}">
                            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="album-info">
                    <div class="album-meta-row">
                        <span class="album-badge">${displayType}</span>
                        <span class="album-date">${album.releaseDate}</span>
                    </div>
                    <h3 class="album-title">${displayTitle}</h3>
                    <div class="album-genre-tag">${displayGenre}</div>
                    <p class="album-desc">${displayDesc}</p>
                    <div class="album-card-actions">
                        <button class="btn-action-preview" data-album-id="${album.id}" data-album-title="${displayTitle}">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                            </svg>
                            <span>${I18N[currentLang].btnQuickPreview}</span>
                        </button>
                        <a class="btn-action-spotify" href="${album.spotifyUrl}" target="_blank" rel="noopener noreferrer">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.306c-.216.353-.674.467-1.027.25-2.812-1.718-6.351-2.107-10.52-1.155-.403.092-.807-.156-.899-.56-.092-.403.156-.807.56-.899 4.566-1.042 8.49-.602 11.636 1.32.353.216.467.674.25 1.027zm1.47-3.264c-.272.441-.853.582-1.294.31-3.219-1.979-8.126-2.552-11.932-1.396-.499.151-1.026-.134-1.177-.633-.151-.499.134-1.026.633-1.177 4.357-1.322 9.773-.683 13.46 1.583.441.272.582.853.31 1.294zm.126-3.41c-3.86-2.292-10.228-2.503-13.899-1.389-.592.18-1.217-.153-1.397-.745-.18-.592.153-1.217.745-1.397 4.225-1.282 11.263-1.037 15.698 1.595.534.317.708 1.011.392 1.545-.316.533-1.011.708-1.539.391z"/>
                            </svg>
                            <span>${I18N[currentLang].btnListenSpotify}</span>
                        </a>
                    </div>
                </div>
            `;

            // Card 3D tilt interaction
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                const rotateX = (-y / rect.height) * 10;
                const rotateY = (x / rect.width) * 10;
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });

            albumsGrid.appendChild(card);
        });

        // Attach modal trigger listeners
        attachPreviewListeners();
    }

    // =========================================================================
    // 6. Spotify Embed Player Modal
    // =========================================================================
    function openPlayerModal(albumId, title) {
        if (!playerModal || !modalIframeContainer) return;

        modalAlbumTitle.textContent = title || 'Spotify Player';
        // Construct Spotify Embed iframe with dark theme
        modalIframeContainer.innerHTML = `
            <iframe 
                src="https://open.spotify.com/embed/album/${albumId}?utm_source=generator&theme=0" 
                width="100%" 
                height="380" 
                frameBorder="0" 
                allowfullscreen="" 
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                loading="lazy"
                style="border-radius: 14px; box-shadow: 0 12px 36px rgba(0,0,0,0.5);">
            </iframe>
        `;

        playerModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closePlayerModal() {
        if (!playerModal) return;
        playerModal.classList.remove('active');
        if (modalIframeContainer) {
            modalIframeContainer.innerHTML = '';
        }
        document.body.style.overflow = '';
    }

    function attachPreviewListeners() {
        const previewBtns = document.querySelectorAll('.btn-preview-icon, .btn-action-preview');
        previewBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const aid = btn.getAttribute('data-album-id');
                const title = btn.getAttribute('data-album-title');
                openPlayerModal(aid, title);
            });
        });
    }

    // =========================================================================
    // 7. Filter Controls
    // =========================================================================
    function setupFilters() {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeFilter = btn.getAttribute('data-filter') || 'all';
                renderAlbums();
            });
        });
    }

    // =========================================================================
    // 8. Clipboard Copy & Toast Feedback
    // =========================================================================
    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('visible');
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => {
            toast.classList.remove('visible');
        }, 3200);
    }

    function setupEmailCopy() {
        if (!btnCopyEmail) return;
        btnCopyEmail.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = 'echos@dreamy.voyage';
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(email);
                } else {
                    const tempInput = document.createElement('input');
                    tempInput.value = email;
                    document.body.appendChild(tempInput);
                    tempInput.select();
                    document.execCommand('copy');
                    document.body.removeChild(tempInput);
                }
                showToast(I18N[currentLang].emailCopiedToast);
            } catch (err) {
                console.warn('Clipboard copy error:', err);
                window.location.href = `mailto:${email}`;
            }
        });
    }

    // =========================================================================
    // 9. Initial Load & Event Binding
    // =========================================================================
    async function init() {
        // Setup language toggle
        if (langToggleBtn) {
            langToggleBtn.addEventListener('click', toggleLanguage);
        }

        // Setup modal close
        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', closePlayerModal);
        }
        if (playerModal) {
            playerModal.addEventListener('click', (e) => {
                if (e.target === playerModal || e.target.classList.contains('modal-backdrop')) {
                    closePlayerModal();
                }
            });
        }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && playerModal && playerModal.classList.contains('active')) {
                closePlayerModal();
            }
        });

        // Setup filters & email copy
        setupFilters();
        setupEmailCopy();

        // Load albums data
        try {
            const resp = await fetch('albums.json');
            if (resp.ok) {
                albumsData = await resp.json();
            } else {
                albumsData = FALLBACK_ALBUMS;
            }
        } catch (e) {
            console.warn('[FFVoid] Using fallback album dataset:', e);
            albumsData = FALLBACK_ALBUMS;
        }

        // Apply initial language
        applyLanguage(currentLang);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
