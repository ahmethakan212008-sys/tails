const SUPABASE_URL = "https://yvmgmhtmlxymaezmhxlh.supabase.co";
        const SUPABASE_ANON_KEY = "sb_publishable_WbQpgb0yi3tGfqQKyeN4_Q_lam1uyqu";
        const YETKILI_SIFRESI = "drcoconutmerrychristmasisforyou";
        const supabaseConfigured = /^https?:\/\//.test(SUPABASE_URL) && !SUPABASE_ANON_KEY.includes("BURAYA_");
        const supabaseClient = supabaseConfigured
            ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
            : null;
        const applicationTypes = ["Oyuncu", "Whitelist", "Moderatör", "Yetkili", "Verifyed", "Security"];
        let aktifKlasor = "Oyuncu";
        let yenilemeSurumu = 0;

        const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);

        function girisYap(event) {
            event.preventDefault();
            const error = document.getElementById("loginError");
            if (document.getElementById("adminPassword").value !== YETKILI_SIFRESI) {
                error.textContent = "Şifre hatalı. Tekrar deneyin.";
                return;
            }
            sessionStorage.setItem("rp_admin", "true");
            paneliGoster();
        }

        function paneliGoster() {
            document.getElementById("loginScreen").classList.add("hidden");
            document.getElementById("adminPanel").classList.remove("hidden");
            
            verileriYenile();
        }

        function cikisYap() {
            sessionStorage.removeItem("rp_admin");
            document.getElementById("adminPanel").classList.add("hidden");
            document.getElementById("loginScreen").classList.remove("hidden");
            document.getElementById("adminPassword").value = "";
        }

        function klasorDegistir(tur) {
            aktifKlasor = tur;
            applicationTypes.forEach((type) => {
                const buttonId = { Oyuncu: "folderOyuncu", Whitelist: "folderWhitelist", Moderatör: "folderMod", Yetkili: "folderYetkili", Verifyed: "folderVerifyed", Security: "folderSecurity" }[type];
                document.getElementById(buttonId).classList.toggle("active", tur === type);
            });
            document.getElementById("dynamicHeading").textContent =
                tur === "Oyuncu" || tur === "Whitelist" ? "Karakter adı" : "Başvuru alanı";
            verileriYenile();
        }

        async function verileriYenile() {
            const tbody = document.getElementById("applicationList");
            const notice = document.getElementById("connectionNotice");
            const buSurum = ++yenilemeSurumu;
            if (!supabaseConfigured) { 
                notice.textContent = "Supabase bağlantısı henüz ayarlanmamış. SUPABASE_URL ve SUPABASE_ANON_KEY değerlerini bu dosyanın script bölümüne ve başvuru formuna ekleyin.";
                notice.classList.remove("hidden");
                tbody.innerHTML = '<tr><td colspan="5">Bağlantı ayarları bekleniyor; başvurular yüklenemiyor.</td></tr>';
                return;
            }

            notice.classList.add("hidden");
            tbody.innerHTML = '<tr><td colspan="5">Başvurular yükleniyor...</td></tr>';
            try {
                const { data, error } = await
                    supabaseClient
                        .from("başvurular")
                        .select("*")
                        .order("created_at", {	ascending:
                    false });

                    if (buSurum !== yenilemeSurumu) return;
                    if (error) throw error;
                const applications = data || [];
                document.getElementById("countOyuncu").textContent = applications.filter((item) => item.form_turu === "Oyuncu").length;
                document.getElementById("countWhitelist").textContent = applications.filter((item) => item.form_turu === "Whitelist").length;
                document.getElementById("countMod").textContent = applications.filter((item) => item.form_turu === "Moderatör").length;
                document.getElementById("countYetkili").textContent = applications.filter((item) => item.form_turu === "Yetkili").length;
                document.getElementById("countVerifyed").textContent = applications.filter((item) => item.form_turu === "Verifyed").length;
                document.getElementById("countSecurity").textContent = applications.filter((item) => item.form_turu === "Security").length;
                const filtered = applications.filter((item) => item.form_turu === aktifKlasor);
                if (!filtered.length) {
                    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Bu klasörde henüz başvuru yok</td></tr>';
                    return;
                }

                tbody.innerHTML = filtered.map((item) => {
                    const status = ["Beklemede", "Onaylandı", "Reddedildi"].includes(item.durum) ? item.durum : "Beklemede";
                    const options = ["Beklemede", "Onaylandı", "Reddedildi"].map((option) =>
                        `<option value="${option}" ${status === option ? "selected" : ""}>${option}</option>`
                    ).join("");
                    const headingValue = aktifKlasor === "Oyuncu" || aktifKlasor === "Whitelist"
                        ? item.karakter_adi
                        : item.karakter_adi || `${aktifKlasor} başvurusu`;
                    return `<tr>
                        <td>${escapeHtml(item.discord_adi)}</td>
                        <td>${escapeHtml(item.yas)}</td>
                        <td>${escapeHtml(headingValue)}</td>
                        <td>${escapeHtml(status)}</td>
                        <td><select class="status-select" aria-label="Başvuru durumunu değiştir" onchange="durumGuncelle(${Number(item.id)}, this.value)">${options}</select></td>
                    </tr>
                    <tr class="details-row"><td colspan="5"><details><summary>Başvuru yanıtlarını görüntüle</summary>${escapeHtml(item.deneyim)}</details></td></tr>`;
                }).join("");
            } catch (error) {
                notice.textContent = "Başvurular yüklenemedi: " + error.message + " Supabase bağlantısını, tabloyu ve RLS izinlerini kontrol edin.";
                notice.classList.remove("hidden");
                tbody.innerHTML = '<tr><td colspan="5">Başvurular yüklenemedi. Ayrıntı için uyarıyı kontrol edin.</td></tr>';
                console.error("Başvurular yüklenirken hata oluştu:", error);
            }
        }

        async function durumGuncelle(id, yeniDurum) {
            if (!id || !["Beklemede", "Onaylandı", "Reddedildi"].includes(yeniDurum)) return;
            const { error } = await supabaseClient
                .from("basvurular")
                .update({ durum: yeniDurum })
                .eq("id", id);
            if (error) {
                alert("Başvuru durumu güncellenemedi: " + error.message);
                return;
            }
            await verileriYenile();
        }

        document.getElementById("loginForm").addEventListener("submit", girisYap);
        if (sessionStorage.getItem("rp_admin") === "true") paneliGoster();
