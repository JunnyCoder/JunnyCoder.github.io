// 1. Tailwind Configuration
if (typeof tailwind !== "undefined") {
	tailwind.config = {
		theme: {
			extend: {
				colors: {
					brandMain: "#0D2971", // Deep Corporate Blue
					brandPoint: "#58C8F0", // Vibrant Sky Blue
					brandSub: "#F1F5F9", // Cool Grey background
					brandDark: "#040D2D", // Dark Navy for backgrounds
					brandText: "#1E293B", // Slate 800
				},
				fontFamily: {
					sans: ["Pretendard", "system-ui", "sans-serif"],
					head: ["IBM Plex Sans KR", "sans-serif"],
					mono: ["JetBrains Mono", "monospace"],
				},
			},
		},
	};
}

// 2. Global state and Fallback Data
window.resumeData = { ko: null, en: null };

const fallbackKo = {
	name: "김준호",
	title: "Smart Factory & MES Operations Engineer",
	contact: {
		email: "junny.coder@gmail.com",
		phone: "+82 (010) 7701-8414",
		github: "github.com/JunnyCoder",
	},
	summary: {
		title: "프로필 요약",
		description:
			"글로벌 완성차 Tier-1 업체인 현대모비스 미국 조지아 법인에서 생산 제어 및 MES 운영을 전담해 온 스마트팩토리 전문가입니다. 하드웨어 설비(PLC, RFID, 스캐너)와 중앙 MES 데이터베이스를 유기적으로 연결하고, 대용량 실시간 트랜잭션을 중단 없이 처리하는 아키텍처 설계를 지향합니다. 현장과의 직관적인 소통을 바탕으로 연간 시스템 가동률 99.9%를 유지하는 안정성 중심의 엔지니어입니다.",
	},
	experience: [
		{
			company: "현대모비스 미국 조지아 법인 (Hyundai Mobis Georgia, USA)",
			period: "2023.01 - 2025.12",
			role: "스마트팩토리 MES / IT 시스템 운영 엔지니어",
			achievements: [
				{
					header: "핵심 공정 가동률 99.9% 유지: ",
					contents:
						"공장 조립 라인 및 자동 분류 창고(WMS) 실시간 로그 모니터링 시스템을 설계하여 누적 1,400여 건의 오작동 및 설비 에러를 선제적으로 조치.",
				},
				{
					header: "하드웨어-소프트웨어 인터페이스 최적화: ",
					contents:
						"PLC 제어 패널, 스마트 RFID, 하니웰 바코드 스캐너 간 소켓 통신 모듈 커스터마이징을 수행하여 데이터 유실율 0.01% 미만으로 개선.",
				},
				{
					header: "대용량 트랜잭션 DB 튜닝: ",
					contents:
						"공정 실시간 데이터 입출력 부하를 완화하기 위해 SQL 쿼리 튜닝 및 인덱스 최적화를 담당, 실시간 쿼리 처리 속도를 평균 35% 단축.",
				},
				{
					header: "현장 밀착 요구사항 분석: ",
					contents:
						"기계 오작동 발생 시 생산 조장 및 작업자들과의 적극적인 커뮤니케이션을 통해 에러 패턴을 규명하고 UI/UX 조작 직관성 개선.",
				},
			],
		},
		{
			company: "(주)케이브레인 컴퍼니",
			period: "2022.01 - 2022.06",
			role: "웹빌더 서비스 기획자",
			achievements: [
				{
					header: "웹빌더 서비스(WEVEN) 기획: ",
					contents: "프로젝트 생애 주기 기반 요구사항 정의 및 일정 관리 수립.",
				},
				{
					header: "사용자 행동 데이터 수집 설계: ",
					contents:
						"가입 및 빌더 내 이탈 구간 개선을 위한 이벤트 태깅 파이프라인 기획.",
				},
			],
		},
	],
	skills: [
		{
			category: "Languages & Frameworks",
			items: "C#, .NET Core, ASP.NET Core, Java, JavaScript, Python, C++",
		},
		{
			category: "Databases & Protocols",
			items:
				"Oracle Database, MS SQL Server, MySQL, Redis, TCP/IP Socket, MQTT, OPC UA",
		},
		{
			category: "Industrial & Tools",
			items:
				"PLC Connection (Mitsubishi, Rockwell), RFID/Barcode Scanners, Linux, Docker, Git, SVN",
		},
		{
			category: "Certifications & Education",
			items:
				"정보처리기사 (Engineer Information Processing), SQLD (SQL Developer), Georgia Tech MicroMasters Analytics (학습 중)",
		},
	],
};

const fallbackEn = {
	name: "Junho Kim",
	title: "Smart Factory & MES Operations Engineer",
	contact: {
		email: "junny.coder@gmail.com",
		phone: "+1 (770) 589-4307",
		github: "github.com/JunnyCoder",
	},
	summary: {
		title: "Professional Summary",
		description:
			"A highly-skilled Smart Factory Expert specializing in Manufacturing Execution Systems (MES) and production line automation. Built substantial hands-on experience at Hyundai Mobis Georgia (USA), supply chain lead for major automotive plants. Dedicated to bridging shop-floor hardware (PLCs, smart RFIDs, automated scanners) with enterprise-scale databases. Prides in maintaining a 99.9% uptime record through proactive data monitoring and cross-functional team collaborations.",
	},
	experience: [
		{
			company: "Hyundai Mobis Georgia, USA",
			period: "Jan 2023 - Present",
			role: "Smart Factory MES & IT Operations Engineer",
			achievements: [
				{
					header: "99.9% System Uptime Shield: ",
					contents:
						"Designed and operated a unified real-time alert system monitoring the assembly lines and automated warehouse systems (WMS). Resolved 1,400+ potential bottlenecks before causing downstream failures.",
				},
				{
					header: "HW-SW Interface Optimization: ",
					contents:
						"Standardized socket-based multi-thread communications connecting Mitsubishi/Rockwell PLCs, Honeywell barcode devices, and high-frequency RFIDs. Reduced packet loss to < 0.01%.",
				},
				{
					header: "High-Throughput DB Tuning: ",
					contents:
						"Led database optimization for high-speed manufacturing transactions. Rewrote complex Oracle/MSSQL queries and restructured partition indices, achieving a 35% faster response rate during peak hours.",
				},
				{
					header: "Cross-functional Problem Solving: ",
					contents:
						"Walked the production floor daily. Interviewed technicians and line leaders to map operational failure patterns into concrete UX updates for easier line troubleshooting.",
				},
			],
		},
		{
			company: "K-Brain Company Corp (WEVEN)",
			period: "Jan 2022 - Jun 2022",
			role: "Web Builder Service Planner",
			achievements: [
				{
					header: "Service Planning: ",
					contents:
						"Annuled user feedback and planned structured modular layouts along the project software life cycle.",
				},
				{
					header: "User Analytics Ingestion: ",
					contents:
						"Defined tracking funnels and mapped interaction patterns to optimize builder navigation paths.",
				},
			],
		},
	],
	skills: [
		{
			category: "Languages & Frameworks",
			items: "C#, .NET Core, ASP.NET Core, Java, JavaScript, Python, C++",
		},
		{
			category: "Databases & Protocols",
			items:
				"Oracle Database, MS SQL Server, MySQL, Redis, TCP/IP Socket, MQTT, OPC UA",
		},
		{
			category: "Industrial & Tools",
			items:
				"PLC Integration (Rockwell, Mitsubishi), Barcode Systems, RFID, Docker, Linux, Git",
		},
		{
			category: "Certifications & Education",
			items:
				"Engineer Information Processing (Korea), SQLD (SQL Developer), Georgia Tech MicroMasters Analytics (In Progress)",
		},
	],
};

// 3. Utility Functions: Resume Data Fetching & Rendering
async function fetchResumeData() {
	const spinner = document.getElementById("resume-loading-spinner");
	if (spinner) spinner.classList.remove("hidden");

	const githubRawPrefix =
		"https://raw.githubusercontent.com/JunnyCoder/JunnyCoder.github.io/main/assets/resume/";

	try {
		let resKo = await fetch("./assets/resume/resume_ko.json");
		let resEn = await fetch("./path/to/dummy.json"); // Just to avoid local error first? No, let's use real logic
		// Actually better: check if file exists via relative path as per original code
		resEn = await fetch("./assets/resume/resume_en.json");

		if (!resKo.ok || !resEn.ok) {
			console.warn(
				"Relative path fetch failed. Attempting Direct GitHub Raw CDN fallback...",
			);
			resKo = await fetch(githubRawPrefix + "resume_ko.json");
			resEn = await fetch(githubRawPrefix + "resume_en.json");
		}

		if (resKo.ok && resEn.ok) {
			window.resumeData.ko = await resKo.json();
			window.resumeData.en = await resEn.json();
			console.log("Resume successfully fetched from Live Data Sources!");
		} else {
			throw new Error("Both Relative and Raw GitHub fetches failed.");
		}
	} catch (err) {
		console.warn(
			"Network fetch failed completely. Engaging high-fidelity local memory fallback.",
			err,
		);
		window.resumeData.ko = fallbackKo;
		window.resumeData.en = fallbackEn;
	} finally {
		if (spinner) spinner.classList.add("hidden");
		renderResume("ko");
		renderResume("en");
	}
}

function renderResume(lang) {
	const data = window.resumeData[lang];
	const container = document.getElementById(`lang-${lang}-container`);
	if (!data || !container) return;

	let expHtml = "";
	data.experience.forEach((exp) => {
		const achievementsList = exp.achievements
			? exp.achievements
					.map((ach) => {
						if (typeof ach === "string") {
							return `<li class="text-gray-600 dark:text-gray-300 mb-1 list-disc list-inside">${ach}</li>`;
						}
						const header = ach.header || "";
						const contents = ach.contents || "";
						if (!header && contents) {
							return `<li class="text-gray-600 dark:text-gray-300 mb-1 list-disc list-inside">${contents}</li>`;
						}
						return `
                <li class="text-gray-600 dark:text-gray-300 mb-1 list-disc list-inside">
                    <strong class="text-gray-800 dark:text-gray-100 font-semibold">${header}</strong>${contents}
                </li>`;
					})
					.join("")
			: "";

		expHtml += `
            <div class="mb-6 last:mb-0">
                <div class="flex justify-between items-baseline mb-1">
                    <h3 class="text-base font-bold text-gray-800 dark:text-gray-100">${exp.company}</h3>
                    <span class="text-sm text-gray-500 dark:text-gray-400 font-mono">${exp.period}</span>
                </div>
                <p class="text-sm font-medium text-brandMain mb-2">${exp.role}</p>
                <ul class="space-y-1">
                    ${achievementsList}
                </ul>
            </div>`;
	});

	let skillsHtml = "";
	data.skills.forEach((skill) => {
		skillsHtml += `
            <div class="bg-brandSub p-3 rounded-lg border border-gray-200">
                <div class="font-bold text-brandMain mb-1">${skill.category}</div>
                <div class="text-gray-600">${skill.items}</div>
            </div>`;
	});

	container.innerHTML = `
        <div class="border-b-2 border-brandMain pb-6 flex flex-col md:flex-row justify-between items-start md:items-end">
            <div>
                <h1 class="text-3xl sm:text-4xl font-head font-bold text-brandMain mb-2">${data.name}</h1>
                <p class="text-brandPoint font-bold text-lg font-code">${data.title}</p>
            </div>
            <div class="mt-4 md:mt-0 text-left text-sm text-gray-600 font-code space-y-1">
                <div><i class="fa-solid fa-envelope mr-1.5 text-brandMain"></i> ${data.contact.email}</div>
                <div><i class="fa-solid fa-mobile-screen mr-1.5 text-brandMain"></i> ${data.contact.phone}</div>
                <div><i class="fa-brands fa-github mr-1.5 text-brandMain"></i> ${data.contact.github}</div>
            </div>
        </div>
        <div class="space-y-2 mt-6">
            <h2 class="text-lg font-head font-bold text-brandMain uppercase tracking-wider flex items-center">
                <i class="fa-solid fa-user-check mr-2 text-brandPoint"></i> ${lang === "ko" ? "프로필 요약" : "Professional Summary"}
            </h2>
            <p class="text-gray-600 text-sm leading-relaxed">${data.summary.description}</p>
        </div>
        <div class="space-y-6 mt-8">
            <h2 class="text-lg font-head font-bold text-brandMain uppercase tracking-wider flex items-center border-b border-gray-200 pb-2">
                <i class="fa-solid fa-briefcase mr-2 text-brandPoint"></i> ${lang === "ko" ? "주요 실무 경력" : "Work Experience"}
            </h2>
            ${expHtml}
        </div>
        <div class="space-y-4 mt-8">
            <h2 class="text-lg font-head font-bold text-brandMain uppercase tracking-wider flex items-center border-b border-gray-200 pb-2">
                <i class="fa-solid fa-gear mr-2 text-brandPoint"></i> ${lang === "ko" ? "보유 기술 스택" : "Key Technical Skills"}
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-code">
                ${skillsHtml}
            </div>
        </div>`;
}

// 4. Interaction Functions
function copyToClipboard() {
	const emailText = document.getElementById("email-text").innerText.trim();
	const textArea = document.createElement("textarea");
	textArea.value = emailText;
	textArea.style.position = "absolute";
	textArea.style.left = "-999999px";
	document.body.prepend(textArea);
	textArea.select();
	try {
		document.execCommand("copy");
		showToast();
	} catch (error) {
		console.error("복사 실패", error);
	} finally {
		textArea.remove();
	}
}

function showToast() {
	const toast = document.getElementById("toast");
	if (toast) {
		toast.classList.remove("translate-y-20", "opacity-0");
		setTimeout(() => {
			toast.classList.add("translate-y-20", "opacity-0");
		}, 3000);
	}
}

function switchLanguage(lang) {
	const koContainer = document.getElementById("lang-ko-container");
	const enContainer = document.getElementById("lang-en-container");
	const btnKo = document.getElementById("btn-lang-ko");
	const btnEn = document.getElementById("btn-lang-en");

	if (lang === "ko") {
		if (koContainer) koContainer.classList.remove("lang-hidden");
		if (enContainer) enContainer.classList.add("lang-hidden");
		if (btnKo)
			btnKo.className =
				"px-3 py-1 rounded text-xs font-bold transition-all bg-brandPoint text-brandDark";
		if (btnEn)
			btnEn.className =
				"px-3 py-1 rounded text-xs font-bold transition-all text-gray-300 hover:text-white";
	} else {
		if (enContainer) enContainer.classList.remove("lang-hidden");
		if (koContainer) koContainer.classList.add("lang-hidden");
		if (btnEn)
			btnEn.className =
				"px-3 py-1 rounded text-xs font-bold transition-all bg-brandPoint text-brandDark";
		if (btnKo)
			btnKo.className =
				"px-3 py-1 rounded text-xs font-bold transition-all text-gray-300 hover:text-white";
	}
}

// 5. Simulator Logic
const Simulator = {
	state: "WAITING",
	trackEl: null,
	tablesEl: null,
	btnOpt: null,
	modules: [],
	lastSpawnTime: 0,
	isMobileView: false,

	dataBad: [
		{
			title: "공정 1 (투입)",
			tasks: [
				{ n: "자재 로딩", t: "2s" },
				{ n: "1차 검수", t: "1s" },
			],
		},
		{
			title: "공정 2 (조립)",
			tasks: [
				{ n: "하부 프레임", t: "3s" },
				{ n: "나사 체결", t: "2s" },
			],
		},
		{
			title: "공정 3 (핵심 병목)",
			tasks: [
				{ n: "정밀 용접", t: "18s", w: true },
				{ n: "센서 부착", t: "15s", w: true },
				{ n: "비전 검사", t: "12s", w: true },
			],
		},
		{ title: "공정 4 (마감)", tasks: [{ n: "표면 처리", t: "2s" }] },
		{ title: "공정 5 (출하)", tasks: [{ n: "최종 패키징", t: "3s" }] },
	],
	dataGood: [
		{
			title: "공정 1 (투입)",
			tasks: [
				{ n: "자재 로딩", t: "2s" },
				{ n: "1차 검수", t: "1s" },
				{ n: "사전 용접", t: "6s", new: true },
			],
		},
		{
			title: "공정 2 (조립)",
			tasks: [
				{ n: "하부 프레임", t: "3s" },
				{ n: "나사 체결", t: "2s" },
				{ n: "센서 모듈화", t: "5s", new: true },
			],
		},
		{
			title: "공정 3 (최적화 됨)",
			tasks: [
				{ n: "정밀 용접", t: "6s", opt: true },
				{ n: "비전 검사", t: "6s", opt: true },
			],
		},
		{
			title: "공정 4 (마감)",
			tasks: [
				{ n: "표면 처리", t: "2s" },
				{ n: "잔여 용접", t: "6s", new: true },
			],
		},
		{
			title: "공정 5 (출하)",
			tasks: [
				{ n: "최종 패키징", t: "3s" },
				{ n: "잔여 센서", t: "5s", new: true },
			],
		},
	],

	init() {
		this.trackEl = document.getElementById("sim-track");
		this.tablesEl = document.getElementById("sim-tables");
		this.btnOpt = document.getElementById("btn-optimize");

		if (!this.tablesEl) return;
		this.renderTables(this.dataBad);
		if (this.btnOpt) this.btnOpt.disabled = true;

		this.checkLayout();
		window.addEventListener("resize", () => this.checkLayout());

		if (this.btnOpt)
			this.btnOpt.addEventListener("click", () => this.optimize());

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && this.state === "WAITING") {
					this.start();
				}
			},
			{ threshold: 0.3 },
		);

		const simSection = document.getElementById("simulator");
		if (simSection) observer.observe(simSection);
	},

	checkLayout() {
		this.isMobileView = window.innerWidth < 768;
		this.positionNodes();

		const warningLine = document.getElementById("sim-warning-line");
		if (warningLine) {
			if (this.isMobileView) {
				warningLine.style.left = "10%";
				warningLine.style.right = "10%";
				warningLine.style.top = "25%";
			} else {
				warningLine.style.left = "40%";
				warningLine.style.right = "40%";
				warningLine.style.top = "50%";
			}
		}
	},

	positionNodes() {
		const nodes = {
			p1: document.getElementById("node-p1"),
			p2: document.getElementById("node-p2"),
			p3: document.getElementById("node-p3"),
			p4: document.getElementById("node-p4"),
			p5: document.getElementById("node-p5"),
		};

		if (this.isMobileView) {
			this.setNodePos(nodes.p1, 15, 25);
			this.setNodePos(nodes.p2, 50, 25);
			this.setNodePos(nodes.p3, 85, 25);
			this.setNodePos(nodes.p4, 75, 75);
			this.setNodePos(nodes.p5, 25, 75);
		} else {
			this.setNodePos(nodes.p1, 10, 50);
			this.setNodePos(nodes.p2, 30, 50);
			this.setNodePos(nodes.p3, 50, 50);
			this.setNodePos(nodes.p4, 70, 50);
			this.setNodePos(nodes.p5, 90, 50);
		}
	},

	setNodePos(el, leftPct, topPct) {
		if (!el) return;
		el.style.left = leftPct + "%";
		el.style.top = topPct + "%";
		el.style.transform = "translate(-50%, -50%)";
	},

	renderTables(dataset, isOptimized = false) {
		if (!this.tablesEl) return;
		this.tablesEl.innerHTML = "";
		dataset.forEach((process, idx) => {
			const achievementsList = process.tasks
				? process.tasks
						.map((t) => {
							let color = "text-gray-300";
							if (t.w) color = "text-red-400 font-bold";
							if (t.new) color = "text-brandPoint font-bold";
							if (t.opt) color = "text-green-400 font-bold";
							return `<li class="text-gray-600 dark:text-gray-300 mb-1 list-disc list-inside"><span class="${color}">${t.n}</span> <span class="font-code text-gray-500">${t.t}</span></li>`;
						})
						.join("")
				: "";

			let boxClass =
				"bg-[#0B1529] border border-gray-700 rounded-lg p-3 transition-all duration-500 h-full flex flex-col";
			if (this.state === "BOTTLENECK" && idx === 2) {
				boxClass += " bottleneck-active";
			} else if (
				isOptimized &&
				idx !== 2 &&
				dataset[idx].tasks.some((t) => t.new)
			) {
				boxClass +=
					" border-brandPoint/50 shadow-[0_0_10px_rgba(88,200,240,0.1)]";
			}

			let headerColor =
				this.state === "BOTTLENECK" && idx === 2
					? "text-red-400"
					: "text-gray-400";
			if (isOptimized && idx === 2) headerColor = "text-green-400";

			const el = document.createElement("div");
			el.className = boxClass;
			el.innerHTML = `
                <div class="font-head text-xs font-bold mb-2 pb-2 border-b border-gray-700 flex justify-between items-center"><span class="${headerColor}">${process.title}</span>${this.state === "BOTTLENECK" && idx === 2 ? '<i class="fa-solid fa-triangle-exclamation text-red-500 animate-pulse"></i>' : ""}</div>
                <ul class="space-y-1">${achievementsList}</ul>
            `;
			this.tablesEl.appendChild(el);
		});
	},

	start() {
		this.state = "NORMAL";
		requestAnimationFrame((t) => this.loop(t));
		setTimeout(() => this.triggerBottleneck(), 4000);
	},

	spawn() {
		if (!this.trackEl) return;
		const el = document.createElement("div");
		el.className =
			"absolute w-4 h-4 sm:w-5 sm:h-5 bg-white border-2 border-brandMain rounded shadow-[0_0_10px_rgba(255,255,255,0.5)] z-20 conveyor-module";
		this.trackEl.appendChild(el);
		this.modules.push({ el, progress: 0 });
	},

	loop(timestamp) {
		if (!this.lastSpawnTime) this.lastSpawnTime = timestamp;
		const spawnInterval = this.state === "BOTTLENECK" ? 1200 : 1800;

		if (timestamp - this.lastSpawnTime > spawnInterval) {
			this.spawn();
			this.lastSpawnTime = timestamp;
		}

		for (let i = 0; i < this.modules.length; i++) {
			const mod = this.modules[i];
			let step = 0.5;

			if (this.state === "BOTTLENECK") {
				if (mod.progress >= 44 && mod.progress < 55) step = 0.03;
			} else if (this.state === "OPTIMIZED") {
				step = 1.2;
			}

			if (i > 0) {
				const frontMod = this.modules[i - 1];
				if (frontMod.progress - mod.progress < 6)
					step = Math.min(step, frontMod.progress - mod.progress - 5.5);
				if (step < 0) step = 0;
			}

			mod.progress += step;

			let leftPercent, topPercent;
			if (this.isMobileView) {
				if (mod.progress <= 45) {
					leftPercent = 15 + (mod.progress / 45) * 70;
					topPercent = 25;
				} else if (mod.progress > 45 && mod.progress <= 55) {
					leftPercent = 85;
					topPercent = 25 + ((mod.progress - 45) / 10) * 50;
				} else {
					leftPercent = 85 - ((mod.progress - 55) / 45) * 70;
					topPercent = 75;
				}
			} else {
				leftPercent = 10 + (mod.progress / 100) * 80;
				topPercent = 50;
			}

			mod.el.style.left = leftPercent + "%";
			mod.el.style.top = topPercent + "%";
			mod.el.style.transform = "translate(-50%, -50%)";

			if (mod.progress >= 100) {
				mod.el.remove();
				this.modules.splice(i, 1);
				i--;
			}
		}
		this.animationFrame = requestAnimationFrame((t) => this.loop(t));
	},

	triggerBottleneck() {
		if (this.state === "OPTIMIZED") return;
		this.state = "BOTTLENECK";
		this.renderTables(this.dataBad);
		if (this.btnOpt) this.btnOpt.disabled = false;
		const warningLine = document.getElementById("sim-warning-line");
		if (warningLine) warningLine.style.opacity = "1";
		const p3 = document.getElementById("node-p3");
		if (p3) p3.classList.replace("border-brandMain", "border-red-500");
	},

	optimize() {
		this.state = "OPTIMIZED";
		if (this.btnOpt) this.btnOpt.disabled = true;
		this.renderTables(this.dataGood, true);
		const warningLine = document.getElementById("sim-warning-line");
		if (warningLine) warningLine.style.opacity = "0";
		const p3 = document.getElementById("node-p3");
		if (p3) p3.classList.replace("border-red-500", "border-green-400");

		const overlay = document.getElementById("sim-success-overlay");
		const box = document.getElementById("sim-success-box");
		if (overlay) overlay.classList.remove("hidden");
		setTimeout(() => {
			if (overlay) overlay.classList.remove("opacity-0");
			if (box) {
				box.classList.remove("scale-90");
				box.classList.add("scale-100");
			}
		}, 50);

		if (this.btnOpt) {
			this.btnOpt.innerHTML = `<span class="relative z-10 flex items-center font-head"><i class="fa-solid fa-check mr-2"></i> 라인 정상화 완료</span >`;
			this.btnOpt.classList.replace("border-brandPoint/50", "border-green-400");
			this.btnOpt.classList.replace("text-brandPoint", "text-green-400");
		}

		setTimeout(() => {
			this.state = "NORMAL";
			if (overlay) overlay.classList.add("opacity-0");
			setTimeout(() => {
				if (overlay) overlay.classList.add("hidden");
			}, 1000);
		}, 3000);
	},
};

// 6. Initialization
document.addEventListener("DOMContentLoaded", () => {
	// Initialize Simulator
	Simulator.init();

	const resumeModal = document.getElementById("resume-modal");
	const resumeOpenBtnHeader = document.getElementById("resume-open-btn-header");
	const resumeOpenBtnMobile = document.getElementById("resume-open-btn-mobile");
	const resumeOpenBtnHero = document.getElementById("resume-open-btn-hero");
	const resumeCloseBtn = document.getElementById("resume-close-btn");
	const resumeCloseBtnBottom = document.getElementById(
		"resume-close-btn-bottom",
	);

	function openResume() {
		if (resumeModal) {
			resumeModal.classList.remove("hidden");
			document.body.style.overflow = "hidden";
			if (!window.resumeData.ko) fetchResumeData();
		}
	}

	function closeResume() {
		if (resumeModal) {
			resumeModal.classList.add("hidden");
			document.body.style.overflow = "";
		}
	}

	if (resumeOpenBtnHeader)
		resumeOpenBtnHeader.addEventListener("click", openResume);
	if (resumeOpenBtnMobile) {
		resumeOpenBtnMobile.addEventListener("click", () => {
			openResume();
			const mobileMenu = document.getElementById("mobile-menu");
			if (mobileMenu) mobileMenu.classList.add("hidden");
		});
	}
	if (resumeOpenBtnHero)
		resumeOpenBtnHero.addEventListener("click", openResume);
	if (resumeCloseBtn) resumeCloseBtn.addEventListener("click", closeResume);
	if (resumeCloseBtnBottom)
		resumeCloseBtnBottom.addEventListener("click", closeResume);

	if (resumeModal) {
		resumeModal.addEventListener("click", (e) => {
			if (e.target === resumeModal) closeResume();
		});
	}

	window.addEventListener("keydown", (e) => {
		if (
			e.key === "Escape" &&
			resumeModal &&
			!resumeModal.classList.contains("hidden")
		) {
			closeResume();
		}
	});

	// Terminal Logging
	const terminalContent = document.getElementById("terminal-content");
	const logs = [
		"[SYSTEM] Initializing Smart Factory MES Core...",
		"[INFO] Connecting to Plant DB (Georgia, USA) - OK",
		"[WARN] Anomaly detected on Assembly Line 3.",
		"[AI] Running predictive analysis on Line 3 sensor data...",
		"[AI] Prediction complete. Adjusting operational parameters.",
		"[SUCCESS] Equipment downtime prevented. Flow stabilized.",
		"[DATA] Syncing 14,024 transaction logs to main server...",
		"[SYSTEM] All systems nominal. Awaiting next cycle.",
	];

	let logIndex = 0;
	function createLogElement(text) {
		const el = document.createElement("div");
		const time = new Date().toLocaleTimeString("en-US", { hour12: false });
		let colorClass = "text-gray-400";
		if (text.includes("[WARN]")) colorClass = "text-yellow-400";
		if (text.includes("[SUCCESS]") || text.includes("[OK]"))
			colorClass = "text-green-400";
		if (text.includes("[AI]")) colorClass = "text-brandPoint font-bold";
		el.innerHTML = `<span class="text-gray-600">[${time}]</span> <span class="${colorClass}">${text}</span>`;
		el.className = "log-entry";
		return el;
	}

	setInterval(() => {
		if (!terminalContent) return;
		const newLog = createLogElement(logs[logIndex]);
		terminalContent.appendChild(newLog);
		if (terminalContent.children.length > 8)
			terminalContent.removeChild(terminalContent.firstChild);
		logIndex = (logIndex + 1) % logs.length;
	}, 2500);

	// Handle Mobile Menu Toggle
	const menuBtn = document.getElementById("mobile-menu-btn");
	const mobileMenu = document.getElementById("mobile-menu");
	if (menuBtn && mobileMenu) {
		menuBtn.addEventListener("click", () => {
			mobileMenu.classList.toggle("hidden");
		});
	}
});

// 7. Public API Functions (for inline onclicks)
function copyToClipboard() {
	const emailText = document.getElementById("email-text").innerText.trim();
	const textArea = document.createElement("textarea");
	textArea.value = emailText;
	textArea.style.position = "absolute";
	textArea.style.left = "-999999px";
	document.body.prepend(textArea);
	textArea.select();
	try {
		document.execCommand("copy");
		showToast();
	} catch (error) {
		console.error("복사 실패", error);
	} finally {
		textArea.remove();
	}
}

function showToast() {
	const toast = document.getElementById("toast");
	if (toast) {
		toast.classList.remove("translate-y-20", "opacity-0");
		setTimeout(() => {
			toast.classList.add("translate-y-20", "opacity-0");
		}, 3000);
	}
}

function switchLanguage(lang) {
	const koContainer = document.getElementById("lang-ko-container");
	const enContainer = document.getElementById("lang-en-container");
	const btnKo = document.getElementById("btn-lang-ko");
	const btnEn = document.getElementById("btn-lang-en");

	if (lang === "ko") {
		if (koContainer) koContainer.classList.remove("lang-hidden");
		if (enContainer) enContainer.classList.add("lang-hidden");
		if (btnKo)
			btnKo.className =
				"px-3 py-1 rounded text-xs font-bold transition-all bg-brandPoint text-brandDark";
		if (btnEn)
			btnEn.className =
				"px-3 py-1 rounded text-xs font-bold transition-all text-gray-300 hover:text-white";
	} else {
		if (enContainer) enContainer.classList.remove("lang-hidden");
		if (koContainer) koContainer.classList.add("lang-hidden");
		if (btnEn)
			btnEn.className =
				"px-3 py-1 rounded text-xs font-bold transition-all bg-brandPoint text-brandDark";
		if (btnKo)
			btnKo.className =
				"px-3 py-1 rounded text-xs font-bold transition-all text-gray-300 hover:text-white";
	}
}
