/**
 * FFVoid (虚空造物) — artist page
 * Bilingual copy, album index with hover preview, Spotify embed on selection,
 * copy-to-clipboard for the contact address.
 */

(function () {
    'use strict';

    // =========================================================================
    // 1. Copy (English default, 中文 toggle)
    // =========================================================================
    var I18N = {
        en: {
            skipLink: 'Skip to albums',
            navMusic: 'Music',
            navNotes: 'Notes',
            navContact: 'Contact',
            artistSub: '虚空造物',
            artistName: 'FFVoid',
            heroLede: 'Forging acoustic realities from the infinite void. Atmospheric soundscapes, cyberpunk rhythms, and ethereal synth journeys.',
            heroListen: 'Listen to the albums',
            heroSpotify: 'Open on Spotify',
            latestLabel: 'Latest release',
            musicTitle: 'Albums',
            filterAll: 'All',
            filterDreamy: 'Dreamy Voyage',
            filterGameon: 'Gameon',
            previewOpen: 'Open in Spotify',
            tracks: '{n} tracks',
            notesTitle: 'Why Dreamy Voyage',
            manifestoLead: 'Life carries an odd fragility, like a waking dream that slips through our fingers while we are busy keeping up with the world. In the rush of daily demands and ambient static, it is quiet and sudden how we lose touch with the people we intended to become.',
            manifestoWhy: 'That quiet drift is why Dreamy Voyage exists.',
            manifestoP1: 'The raw melodies begin with AI, so I think of myself not as a maker, but as someone listening for echoes in the fog. Out of countless wandering frequencies, I keep only what speaks directly to the chest—because what truly matters is the door this music might leave unlocked for you.',
            manifestoQuote: 'Out of countless wandering frequencies, I keep only what speaks directly to the chest—because what truly matters is the door this music might leave unlocked for you.',
            manifestoP2: 'I hope these tracks feel like stepping into zero gravity. The textures are hazy and slow, built to soften the edge of the day and let the room expand around you. When the background noise dims and the defenses quiet down, the things you set aside—early promises, half-remembered hopes, the clear light of your original purpose—can drift back into view.',
            manifestoEnding: 'Through all the winding complications of living, may this sound give you a pocket of stillness, and eventually, guide you back to your own shore.',
            manifestoSignature: '— FFVoid (虚空造物) · Echoes in the Fog',
            contactTitle: 'Contact',
            contactSub: 'For sonic collaborations, licensing inquiries, or echoes from across the void.',
            copyHint: 'Click to copy',
            writeEmail: 'Write an email',
            copiedToast: 'Copied: FFVoid@Dreamy.Voyage',
            copyFailed: 'Could not copy. Write to FFVoid@Dreamy.Voyage',
            footerRights: 'All rights reserved. Sculpted in the void.'
        },
        zh: {
            skipLink: '跳到音乐作品',
            navMusic: '音乐',
            navNotes: '手记',
            navContact: '联系',
            artistSub: 'FFVoid',
            artistName: '虚空造物',
            heroLede: '于无界虚空之中雕琢声学实体。沉浸式宇宙氛围、赛博脉冲节奏与缥缈梦境合成器之旅。',
            heroListen: '收听专辑',
            heroSpotify: '前往 Spotify',
            latestLabel: '最新发行',
            musicTitle: '音乐作品',
            filterAll: '全部',
            filterDreamy: '幻梦之旅',
            filterGameon: 'Gameon',
            previewOpen: '在 Spotify 打开',
            tracks: '{n} 首',
            notesTitle: '关于《Dreamy Voyage》',
            manifestoLead: '生活中，不时有种虚幻感，好似一场半梦半醒的旅途。当我们忙着应对世间的规则与事务，虚纵闲暇时光，不知不觉间，恐与最初想要成为的自己渐行渐远。',
            manifestoWhy: '这种无声的游离，是我探索《幻梦之旅 Dreamy Voyage》的初衷。',
            manifestoP1: '原始音符由 AI 唤起，故，我并不自认为创作人，而是更像在漫天迷雾里搜寻那一丝震颤的人。',
            manifestoQuote: '在无尽的超弦交织振动中，寻觅真正能撞击胸口并引起回响的那几缕声线。于我而言，最值得甄采的旋律，应是那些能推开一扇心门的音符序列。',
            manifestoP2: '我愿这些有序排列的频率，能带给你几分短暂的回忆，当身边的喧嚣慢慢消退，心潮重归岑寂时，那些曾被你搁置的誓言、模糊的梦想，以及心底最清澈的初衷，能得以重新浮现。',
            manifestoEnding: '穿越这芜杂而漫长的世间，希望这一程迷幻梦境能赠你片刻思隙，最终，载你抵达心中的彼岸。',
            manifestoSignature: '—— 虚空造物（FFVoid）',
            contactTitle: '联系',
            contactSub: '关于音乐合作、商用授权或跨越维度的灵感交流。',
            copyHint: '点击复制',
            writeEmail: '写邮件',
            copiedToast: '已复制：FFVoid@Dreamy.Voyage',
            copyFailed: '复制失败，请直接发送至 FFVoid@Dreamy.Voyage',
            footerRights: '版权所有 · 于虚空中铸就。'
        }
    };

    // Built-in album list: used instantly, and when albums.json cannot be fetched (e.g. opened from disk).
    var FALLBACK_ALBUMS = [
        {
            id: '5z4jwVk0cENSid6WuOHPuS', title: 'Dreamy.Voyage: Prime 11', titleZh: '幻梦之旅：Prime 11',
            series: 'dreamy', releaseDate: '2026-10-05', type: 'Studio Album', typeZh: '录音室专辑', trackCount: 9,
            genre: 'Cyber Ambient / Future Beats', genreZh: '赛博氛围 / 未来节奏',
            descriptionEn: 'The newest chapter of the Prime series: nine tracks of drifting synths and deep, slow-turning rhythm.',
            descriptionZh: 'Prime 系列的最新篇章，九首曲目，漂浮的合成器与缓缓流转的深沉节奏。',
            spotifyUrl: 'https://open.spotify.com/album/5z4jwVk0cENSid6WuOHPuS',
            localCover: 'assets/covers/prime-11.jpg',
            coverUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d0000b27389950dd8dcd559675cd09258'
        },
        {
            id: '3qiPYJ2Ld4gxj5OyZcrgKJ', title: 'Dreamy.Voyage: Prime 7', titleZh: '幻梦之旅：Prime 7',
            series: 'dreamy', releaseDate: '2026-09-21', type: 'Studio Album', typeZh: '录音室专辑', trackCount: 9,
            genre: 'Cyber Ambient / Future Beats', genreZh: '赛博氛围 / 未来节奏',
            descriptionEn: 'Nine more voyages through the Prime series, from hazy daydreams to long, wandering finales.',
            descriptionZh: 'Prime 系列的又一次远航，九首曲目，从朦胧的白日梦一路走向悠长的漫游终章。',
            spotifyUrl: 'https://open.spotify.com/album/3qiPYJ2Ld4gxj5OyZcrgKJ',
            localCover: 'assets/covers/prime-7.jpg',
            coverUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d0000b273866e3e15f49ab1ea52344025'
        },
        {
            id: '7AHHnrbr9gBBl6s2cIuvc3', title: 'Dreamy.Voyage: Prime 5', titleZh: '幻梦之旅：Prime 5',
            series: 'dreamy', releaseDate: '2026-09-07', type: 'Studio Album', typeZh: '录音室专辑', trackCount: 18,
            genre: 'Cyber Ambient / Future Beats', genreZh: '赛博氛围 / 未来节奏',
            descriptionEn: 'A transcendent auditory voyage through cyberspace and dimensional rifts. The pinnacle milestone of the Prime series.',
            descriptionZh: '穿透赛博空间与虚空维度的巅峰听觉航行，Prime 旗舰系列的终极篇章。',
            spotifyUrl: 'https://open.spotify.com/album/7AHHnrbr9gBBl6s2cIuvc3',
            localCover: 'assets/covers/prime-5.jpg',
            coverUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e0297f3bc46c8b472820bc1a487'
        },
        {
            id: '4ZFSObop5fvoL9seQ1CphS', title: 'Gameon Album 2', titleZh: 'Gameon 专辑 2',
            series: 'gameon', releaseDate: '2026-03-02', type: 'Original Album', typeZh: '原创专辑', trackCount: 16,
            genre: 'Electronic / Chiptune / Synthwave', genreZh: '电子 / 8-Bit / 合成器波',
            descriptionEn: 'High-octane electronic and gaming soundscapes blending neon retro vibes with modern heavy beats.',
            descriptionZh: '高能游戏与电子原声世界，碰撞复古霓虹街机风与现代激昂鼓点。',
            spotifyUrl: 'https://open.spotify.com/album/4ZFSObop5fvoL9seQ1CphS',
            localCover: 'assets/covers/gameon-2.jpg',
            coverUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e022bad063af99755070ef1a0fa'
        },
        {
            id: '12zSLb0ppHpwFtZyha3hOn', title: 'Gameon Album 1', titleZh: 'Gameon 专辑 1',
            series: 'gameon', releaseDate: '2025-11-10', type: 'Original Album', typeZh: '原创专辑', trackCount: 15,
            genre: 'Cyberpunk / Game OST / Electro', genreZh: '赛博朋克 / 游戏原声 / 电子',
            descriptionEn: 'The pioneering installment in the Gameon anthology. Dynamic, exhilarating rhythms crafted for virtual arenas.',
            descriptionZh: 'Gameon 系列的破晓之作，为虚拟竞技场量身构筑的动态燃魂节奏。',
            spotifyUrl: 'https://open.spotify.com/album/12zSLb0ppHpwFtZyha3hOn',
            localCover: 'assets/covers/gameon-1.jpg',
            coverUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02ae9d1ae9158fdc023e025f98'
        },
        {
            id: '5PZ8atoSio9I3XfTgNFSDI', title: 'Dreamy Voyage (Album 3)', titleZh: '幻梦之旅 (专辑 3)',
            series: 'dreamy', releaseDate: '2025-08-23', type: 'Studio Album', typeZh: '录音室专辑', trackCount: 14,
            genre: 'Dream Pop / Ethereal Wave', genreZh: '梦幻流行 / 缥缈波',
            descriptionEn: 'Deep diving into subconscious dream realms with delicate pads, floating melodies, and hazy echoes.',
            descriptionZh: '深潜潜意识梦境深处，以温润合成器铺垫与飘渺旋律勾勒夜色幻景。',
            spotifyUrl: 'https://open.spotify.com/album/5PZ8atoSio9I3XfTgNFSDI',
            localCover: 'assets/covers/dreamy-voyage-3.jpg',
            coverUrl: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e020f291b76d59a3d1b4ea3eb78'
        },
        {
            id: '45pbXcOwLbttHzn1oxzyjW', title: 'Dreamy Voyage (Album 2)', titleZh: '幻梦之旅 (专辑 2)',
            series: 'dreamy', releaseDate: '2025-08-22', type: 'Studio Album', typeZh: '录音室专辑', trackCount: 14,
            genre: 'Chillwave / Ambient Electronic', genreZh: '低保真浪潮 / 氛围电子',
            descriptionEn: 'Atmospheric sound designs capturing the quiet reverie of starlit nebulae and twilight journeys.',
            descriptionZh: '捕捉繁星云隙与薄暮旅程的静谧冥想，流淌空灵纯粹的沉浸式声场。',
            spotifyUrl: 'https://open.spotify.com/album/45pbXcOwLbttHzn1oxzyjW',
            localCover: 'assets/covers/dreamy-voyage-2.jpg',
            coverUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02104ea40b79d4e8b5ae880a21'
        },
        {
            id: '2aPeqkFWPCRYQuFYB0sSQB', title: 'Dreamy Voyage', titleZh: '幻梦之旅 (首专)',
            series: 'dreamy', releaseDate: '2025-08-18', type: 'Debut Album', typeZh: '创世首专', trackCount: 11,
            genre: 'Ambient / Future Electronic', genreZh: '环境氛围 / 原创未来电子',
            descriptionEn: 'The genesis of the Dreamy Voyage universe. Where the void first took acoustic form.',
            descriptionZh: '幻梦之旅宇宙的创世起源之声，虚空造物在此初次赋予虚无以音律。',
            spotifyUrl: 'https://open.spotify.com/album/2aPeqkFWPCRYQuFYB0sSQB',
            localCover: 'assets/covers/dreamy-voyage-1.jpg',
            coverUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02878501f960ceb5e2b3caf1c5'
        }
    ];

    var EMAIL = 'FFVoid@Dreamy.Voyage';
    var mobileQuery = window.matchMedia('(max-width: 899px)');

    var state = {
        lang: 'en',
        albums: [],
        filter: 'all',
        selectedId: null,
        previewId: null,
        playerId: null
    };

    var els = {
        html: document.documentElement,
        header: document.getElementById('site-header'),
        toggle: document.getElementById('lang-toggle'),
        index: document.getElementById('album-index'),
        preview: document.getElementById('preview'),
        previewImg: document.getElementById('preview-img'),
        previewTitle: document.getElementById('preview-title'),
        previewMeta: document.getElementById('preview-meta'),
        previewDesc: document.getElementById('preview-desc'),
        previewSpotify: document.getElementById('preview-spotify'),
        slot: document.getElementById('player-slot'),
        filters: Array.prototype.slice.call(document.querySelectorAll('.filter')),
        heroLink: document.getElementById('hero-latest-link'),
        heroImg: document.getElementById('hero-latest-img'),
        heroTitle: document.getElementById('hero-latest-title'),
        heroDate: document.getElementById('hero-latest-date'),
        copyBtn: document.getElementById('copy-email'),
        toast: document.getElementById('toast')
    };

    // =========================================================================
    // 2. Helpers
    // =========================================================================
    function safeGet(key) {
        try { return window.localStorage.getItem(key); } catch (e) { return null; }
    }

    function safeSet(key, value) {
        try { window.localStorage.setItem(key, value); } catch (e) { /* private mode: ignore */ }
    }

    function t(key) {
        var dict = I18N[state.lang] || I18N.en;
        if (dict[key] != null) return dict[key];
        return I18N.en[key] != null ? I18N.en[key] : '';
    }

    function esc(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function isZh() { return state.lang === 'zh'; }

    function titleOf(a) { return isZh() ? (a.titleZh || a.title) : a.title; }
    function typeOf(a) { return isZh() ? (a.typeZh || a.type) : a.type; }
    function genreOf(a) { return isZh() ? (a.genreZh || a.genre) : a.genre; }
    function descOf(a) { return isZh() ? (a.descriptionZh || a.descriptionEn) : a.descriptionEn; }
    function coverOf(a) { return a.localCover || a.coverUrl; }
    function yearOf(a) { return (a.releaseDate || '').slice(0, 4); }

    function spotifyUrlOf(a) {
        return a.spotifyUrl || ('https://open.spotify.com/album/' + a.id);
    }

    function formatDate(iso) {
        var d = new Date(iso + 'T00:00:00');
        if (isNaN(d.getTime())) return iso || '';
        var locale = isZh() ? 'zh-CN' : 'en-GB';
        return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(d);
    }

    function findAlbum(id) {
        for (var i = 0; i < state.albums.length; i++) {
            if (state.albums[i].id === id) return state.albums[i];
        }
        return null;
    }

    function visibleAlbums() {
        return state.albums.filter(function (a) {
            return state.filter === 'all' || a.series === state.filter;
        });
    }

    function sortNewestFirst(list) {
        return list.slice().sort(function (a, b) {
            return (b.releaseDate || '').localeCompare(a.releaseDate || '');
        });
    }

    // =========================================================================
    // 3. Language
    // =========================================================================
    function applyLanguage(lang) {
        state.lang = lang === 'zh' ? 'zh' : 'en';
        safeSet('ffvoid_lang', state.lang);

        els.html.lang = isZh() ? 'zh-CN' : 'en';
        document.title = isZh()
            ? 'FFVoid 虚空造物 · 官方音乐主页'
            : 'FFVoid 虚空造物 · Official Artist Page';

        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            el.textContent = t(el.getAttribute('data-i18n'));
        });

        els.toggle.textContent = isZh() ? 'EN' : '中文';
        els.toggle.setAttribute('aria-label', isZh() ? 'Switch to English' : '切换为中文');

        splitHeroName();

        renderHeroLatest();
        renderIndex();
    }

    // =========================================================================
    // 4. Hero: latest release
    // =========================================================================
    function renderHeroLatest() {
        var latest = state.albums[0];
        if (!latest) return;
        els.heroImg.src = coverOf(latest);
        els.heroImg.alt = titleOf(latest);
        els.heroTitle.textContent = titleOf(latest);
        els.heroDate.textContent = formatDate(latest.releaseDate);
    }

    // =========================================================================
    // 5. Album index
    // =========================================================================
    function renderIndex() {
        // Move the player out of the list before rebuilding it.
        els.preview.appendChild(els.slot);

        var list = visibleAlbums();
        var stillListed = list.some(function (a) { return a.id === state.selectedId; });
        if (!stillListed) {
            // Desktop always keeps one album open; mobile starts collapsed.
            state.selectedId = mobileQuery.matches || !list[0] ? null : list[0].id;
        }

        els.index.innerHTML = list.map(function (a) {
            var id = esc(a.id);
            var selected = a.id === state.selectedId;
            var year = esc(yearOf(a));
            return '' +
                '<div class="row' + (selected ? ' is-selected' : '') + '" data-row="' + id + '">' +
                    '<button class="row-main" type="button" data-id="' + id + '" aria-pressed="' + selected + '">' +
                        '<img class="row-thumb" src="' + esc(coverOf(a)) + '" alt="" width="56" height="56" loading="lazy">' +
                        '<span class="row-year">' + year + '</span>' +
                        '<span class="row-body">' +
                            '<span class="row-title">' + esc(titleOf(a)) + '</span>' +
                            '<span class="row-meta">' +
                                '<span class="row-year-m">' + year + '</span>' +
                                '<span>' + esc(typeOf(a)) + '</span>' +
                                '<span>' + esc(genreOf(a)) + '</span>' +
                            '</span>' +
                        '</span>' +
                    '</button>' +
                '</div>';
        }).join('');

        els.index.querySelectorAll('.row-main').forEach(function (btn) {
            var id = btn.getAttribute('data-id');
            btn.addEventListener('click', function () { toggleSelect(id); });
            btn.addEventListener('pointerenter', function (e) {
                if (e.pointerType === 'mouse' && !mobileQuery.matches) renderPreview(id);
            });
            btn.addEventListener('pointerleave', function (e) {
                if (e.pointerType === 'mouse' && !mobileQuery.matches) renderPreview(state.selectedId);
            });
            btn.addEventListener('focus', function () {
                if (!mobileQuery.matches) renderPreview(id);
            });
        });

        placePlayer();
        renderPreview(state.selectedId);
    }

    function syncRows() {
        els.index.querySelectorAll('.row').forEach(function (row) {
            var id = row.getAttribute('data-row');
            var selected = id === state.selectedId;
            row.classList.toggle('is-selected', selected);
            row.querySelector('.row-main').setAttribute('aria-pressed', String(selected));
        });
    }

    function toggleSelect(id) {
        // On mobile, tapping the open album closes it. On desktop, one album always stays open.
        if (mobileQuery.matches && state.selectedId === id) {
            state.selectedId = null;
        } else {
            state.selectedId = id;
        }
        syncRows();
        placePlayer();
        renderPreview(state.selectedId || id);
    }

    function setFilter(filter) {
        state.filter = filter;
        els.filters.forEach(function (btn) {
            btn.setAttribute('aria-pressed', String(btn.getAttribute('data-filter') === filter));
        });
        renderIndex();
    }

    // =========================================================================
    // 6. Preview panel (desktop): follows hover and focus
    // =========================================================================
    function renderPreview(id) {
        var a = findAlbum(id) || visibleAlbums()[0];
        if (!a) return;
        state.previewId = a.id;

        els.previewTitle.textContent = titleOf(a);
        els.previewMeta.innerHTML =
            '<span>' + esc(typeOf(a)) + '</span>' +
            '<span>' + esc(genreOf(a)) + '</span>' +
            '<span>' + esc(formatDate(a.releaseDate)) + '</span>' +
            '<span>' + esc(t('tracks').replace('{n}', a.trackCount || '')) + '</span>';
        els.previewDesc.textContent = descOf(a);
        els.previewSpotify.href = spotifyUrlOf(a);

        if (els.previewImg.getAttribute('data-id') !== a.id) {
            swapPreviewCover(a);
        }
    }

    function swapPreviewCover(a) {
        var img = els.previewImg;
        var fallbackUsed = false;
        img.setAttribute('data-id', a.id);
        img.alt = titleOf(a);
        img.classList.add('is-changing');

        var done = function () { img.classList.remove('is-changing'); };
        img.onload = done;
        img.onerror = function () {
            if (!fallbackUsed && a.coverUrl) {
                fallbackUsed = true;
                img.src = a.coverUrl;
                return;
            }
            done();
        };
        img.src = coverOf(a);
    }

    // =========================================================================
    // 7. Spotify player: one embed, placed under the row on mobile, in the panel on desktop
    // =========================================================================
    function placePlayer() {
        var a = state.selectedId ? findAlbum(state.selectedId) : null;

        if (!a) {
            els.slot.innerHTML = '';
            state.playerId = null;
            els.slot.hidden = true;
            els.preview.appendChild(els.slot);
            return;
        }

        if (mobileQuery.matches) {
            var row = els.index.querySelector('.row[data-row="' + a.id + '"]');
            if (row) {
                row.insertAdjacentElement('afterend', els.slot);
            } else {
                els.preview.appendChild(els.slot);
            }
        } else {
            els.preview.appendChild(els.slot);
        }

        els.slot.hidden = false;

        if (state.playerId !== a.id) {
            state.playerId = a.id;
            els.slot.innerHTML =
                '<iframe title="' + esc(titleOf(a)) + ' — Spotify" ' +
                'src="https://open.spotify.com/embed/album/' + esc(a.id) + '?utm_source=generator&amp;theme=0" ' +
                'width="100%" height="352" frameborder="0" loading="lazy" ' +
                'allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>';
        }
    }

    // =========================================================================
    // 8. Contact: copy address
    // =========================================================================
    var toastTimer = 0;

    function showToast(message) {
        els.toast.textContent = message;
        els.toast.classList.add('is-visible');
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(function () {
            els.toast.classList.remove('is-visible');
        }, 2600);
    }

    function fallbackCopy(text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        document.body.removeChild(ta);
        return ok;
    }

    function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text).then(function () {
                return true;
            }, function () {
                return fallbackCopy(text);
            });
        }
        return Promise.resolve(fallbackCopy(text));
    }

    // =========================================================================
    // 9. Data loading and init
    // =========================================================================
    // =========================================================================
    // 8b. Hero wordmark: each letter's weight follows the pointer
    // =========================================================================
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var W_MAX = 900;
    var heroLetters = [];
    var heroPointer = { x: -9999, y: -9999, active: false };
    var heroRaf = 0;
    var heroVisible = true;

    function splitHeroName() {
        var holder = document.querySelector('.hero-name [data-i18n="artistName"]');
        var h1 = document.querySelector('.hero-name');
        if (!holder || !h1) return;

        var text = holder.textContent;
        h1.setAttribute('aria-label', text);
        holder.innerHTML = Array.from(text).map(function (c) {
            return '<span class="ch" aria-hidden="true">' + esc(c) + '</span>';
        }).join('');

        heroLetters = Array.prototype.slice.call(holder.querySelectorAll('.ch')).map(function (el) {
            return { el: el, w: 300 };
        });

        measureHeroLetters();
        startHero();
    }

    // Fix each letter's width at its heaviest weight so changing weight never shifts the layout.
    function measureHeroLetters() {
        var run = function () {
            heroLetters.forEach(function (l) {
                l.el.style.width = '';
                l.el.style.fontWeight = W_MAX;
            });
            heroLetters.forEach(function (l) {
                var fs = parseFloat(window.getComputedStyle(l.el).fontSize) || 16;
                l.el.style.width = (l.el.getBoundingClientRect().width / fs) + 'em';
                l.el.style.fontWeight = Math.round(l.w);
            });
        };
        var ready = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
        ready.then(run);
    }

    function tickHero(now) {
        var t = now / 1000;
        heroLetters.forEach(function (l, i) {
            var base = 300 + 90 * Math.sin(t * 0.9 + i * 0.8);
            var target = base;
            if (heroPointer.active) {
                var rect = l.el.getBoundingClientRect();
                var dx = heroPointer.x - (rect.left + rect.width / 2);
                var dy = heroPointer.y - (rect.top + rect.height / 2);
                var k = Math.exp(-(dx * dx + dy * dy) / (2 * 190 * 190));
                target = base + (W_MAX - base) * k;
            }
            l.w += (target - l.w) * 0.14;
            l.el.style.fontWeight = Math.round(l.w);
        });
        heroRaf = window.requestAnimationFrame(tickHero);
    }

    function startHero() {
        if (reduceMotion.matches) {
            heroLetters.forEach(function (l) { l.el.style.fontWeight = 400; });
            return;
        }
        if (!heroRaf && heroVisible && !document.hidden) {
            heroRaf = window.requestAnimationFrame(tickHero);
        }
    }

    function stopHero() {
        if (heroRaf) {
            window.cancelAnimationFrame(heroRaf);
            heroRaf = 0;
        }
    }

    function bindHeroEffects() {
        var track = function (x, y) {
            heroPointer.x = x;
            heroPointer.y = y;
            heroPointer.active = true;
        };
        window.addEventListener('pointermove', function (e) { track(e.clientX, e.clientY); }, { passive: true });
        window.addEventListener('touchmove', function (e) {
            if (e.touches && e.touches[0]) track(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
        document.documentElement.addEventListener('pointerleave', function () { heroPointer.active = false; });

        document.addEventListener('visibilitychange', function () {
            if (document.hidden) { stopHero(); } else { startHero(); }
        });

        var name = document.querySelector('.hero-name');
        if (name && 'IntersectionObserver' in window) {
            new IntersectionObserver(function (entries) {
                heroVisible = entries[0].isIntersecting;
                if (heroVisible) { startHero(); } else { stopHero(); }
            }).observe(name);
        }

        // Latest-release cover tilts toward the pointer.
        els.heroLink.addEventListener('pointermove', function (e) {
            if (e.pointerType !== 'mouse' || reduceMotion.matches) return;
            var r = els.heroLink.getBoundingClientRect();
            var px = (e.clientX - r.left) / r.width - 0.5;
            var py = (e.clientY - r.top) / r.height - 0.5;
            els.heroImg.style.setProperty('--ry', (px * 14).toFixed(2) + 'deg');
            els.heroImg.style.setProperty('--rx', (-py * 14).toFixed(2) + 'deg');
        });
        els.heroLink.addEventListener('pointerleave', function () {
            els.heroImg.style.setProperty('--ry', '0deg');
            els.heroImg.style.setProperty('--rx', '0deg');
        });
    }

    function loadAlbums() {
        return fetch('albums.json', { cache: 'no-cache' })
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(function (data) {
                if (!Array.isArray(data) || !data.length) throw new Error('albums.json is empty');
                return data;
            });
    }

    function bindEvents() {
        els.toggle.addEventListener('click', function () {
            applyLanguage(isZh() ? 'en' : 'zh');
        });

        els.filters.forEach(function (btn) {
            btn.addEventListener('click', function () {
                setFilter(btn.getAttribute('data-filter') || 'all');
            });
        });

        els.heroLink.addEventListener('click', function () {
            var latest = state.albums[0];
            if (!latest) return;
            if (state.filter !== 'all') {
                state.filter = 'all';
                els.filters.forEach(function (b) {
                    b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === 'all'));
                });
            }
            state.selectedId = latest.id;
            renderIndex();
        });

        els.copyBtn.addEventListener('click', function () {
            copyText(EMAIL).then(function (ok) {
                showToast(ok ? t('copiedToast') : t('copyFailed'));
            });
        });

        // In-page links: land on the section heading, not the section's top padding.
        document.addEventListener('click', function (e) {
            if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
            var link = e.target.closest ? e.target.closest('a[href^="#"]') : null;
            if (!link) return;
            var id = link.getAttribute('href').slice(1);
            var target = id === 'top' ? document.getElementById('top') : document.getElementById(id);
            if (!target) return;
            e.preventDefault();

            var heading = target.querySelector('.section-title') || target;
            var headerH = els.header ? els.header.offsetHeight : 0;
            var top = id === 'top' ? 0 : heading.getBoundingClientRect().top + window.pageYOffset - headerH - 24;
            var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            window.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' });
            try { history.replaceState(null, '', '#' + id); } catch (err) { /* ignore */ }
        });

        var onScroll = function () {
            els.header.classList.toggle('is-scrolled', window.scrollY > 40);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        var onViewportChange = function () { renderIndex(); };
        if (mobileQuery.addEventListener) {
            mobileQuery.addEventListener('change', onViewportChange);
        } else if (mobileQuery.addListener) {
            mobileQuery.addListener(onViewportChange);
        }
    }

    function init() {
        var saved = safeGet('ffvoid_lang');
        state.lang = saved === 'zh' ? 'zh' : 'en';

        bindEvents();
        bindHeroEffects();

        // Render immediately with the built-in list, then swap in albums.json when it loads.
        state.albums = sortNewestFirst(FALLBACK_ALBUMS);
        applyLanguage(state.lang);

        loadAlbums()
            .then(function (data) {
                state.albums = sortNewestFirst(data);
                applyLanguage(state.lang);
            })
            .catch(function (err) {
                console.warn('[FFVoid] Using built-in album list:', err);
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
