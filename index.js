const SUPABASE_URL = "https://yvmgmhtmlxymaezmhxlh.supabase.co";
        const SUPABASE_ANON_KEY = "sb_publishable_WbQpgb0yi3tGfqQKyeN4_Q_lam1uyqu";
        const YETKILI_SIFRESI = "drcoconutmerrychristmasisforyou";
        const supabaseConfigured = /^https?:\/\//.test(SUPABASE_URL) && !SUPABASE_ANON_KEY.includes("BURAYA_");
        const supabaseClient = supabaseConfigured
            ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
            : null;

        const applicationTypes = ["Oyuncu", "Whitelist", "Moderatör", "Yetkili", "Verifyed", "Security, Terorist", "Obur üye"];
        let aktifKlasor = "Oyuncu";

        function gondermeDurumunuGuncelle() {
            const form = document.getElementById("rpForm");
            const rulesConfirmed = document.getElementById("confirmRules").checked;
            document.getElementById("submitButton").disabled = !form.checkValidity() || !rulesConfirmed;
        }

        const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);

        function formAlanlariniGuncelle() {
            const type = document.getElementById("registrationType").value;
            const isStaff = type === "Moderatör" || type === "Yetkili";
            const isWhitelist = type === "Whitelist";
            document.getElementById("formType").value = type;
            document.getElementById("charName").required = true;
            document.getElementById("lblCharName").textContent = isStaff
                ? "Başvurmak istediğin görev / ilgi alanın"
                : "Karakter adı ve soyadı (IC)";
            document.getElementById("charName").placeholder = isStaff
                ? "Örnek: Oyun moderatörlüğü"
                : "Örnek: Deniz Yılmaz";
            document.getElementById("moderatorFields").classList.toggle("hidden", !isStaff);
            document.getElementById("moderatorScenarioField").classList.toggle("hidden", !isStaff);
            document.getElementById("moderationExperience").required = isStaff;
            document.getElementById("moderatorScenario").required = isStaff;
            document.getElementById("moderationExperience").previousElementSibling.textContent = type === "Yetkili"
                ? "Daha önce yetkili veya ekip üyesi olarak çalıştın mı? Deneyimini anlat"
                : "Daha önce moderatörlük yaptın mı? yaptıysan deneyimini anlat.";
            document.getElementById("moderationExperience").placeholder = type === "Yetkili"
                ? "Deneyimin yoksa yetkili ekibine neden katılmak istediğini yaz"
                : "Deneyimin yoksa moderatörlüğe neden başvurmak istediğini yaz";
            document.getElementById("moderatorScenarioField").querySelector("label").textContent = type === "Yetkili"
                ? "Bir ekip üyesiyle anlaşmazlık yaşarsan nasıl çözersin?"
                : "Bir kural ihlali bildirimi geldiğinde nasıl incelersin?";
            document.querySelector('label[for="experience"]').textContent = isStaff
                ? "Deneyimin ve bu görev için başvurma nedenin"
                : "Roleplay deneyimin ve bu sunucuya katılma nedenin";
            document.getElementById("experience").placeholder = isStaff
                ? "İlgili deneyiminden güçlü yönlerinden ve ekibe nasıl katkı sağlayacağından bahset"
                : "Daha önce oynadığın sunuculardan sevdiğin rol türlerinden ve burada yapmak istediklerinden bahset";
            document.getElementById("whitelistFields").classList.toggle("hidden", !isWhitelist);
            document.getElementById("whitelistGoalsField").classList.toggle("hidden", !isWhitelist);
            document.getElementById("characterStory").required = isWhitelist;
            document.getElementById("characterGoals").required = isWhitelist;
            gondermeDurumunuGuncelle();
        }

        function ekranDegistir(id) {
            document.getElementById("formScreen").classList.toggle("hidden", id !== "formScreen");
            document.getElementById("adminPanelScreen").classList.toggle("hidden", id !== "adminPanelScreen");
        }

        function loginPopoverGoster(goster) {
            document.getElementById("loginPopover").classList.toggle("hidden", !goster);
            document.getElementById("loginToggle").setAttribute("aria-expanded", String(goster));
        }

        async function yetkiliGirisi(event) {
            event.preventDefault();
            const password = document.getElementById("adminPassword").value;
            if (password !== YETKILI_SIFRESI) {
                alert("Yönetici şifresi hatalı.");
                return;
            }

            localStorage.setItem("rp_role", "admin");
            loginPopoverGoster(false);
            ekranDegistir("adminPanelScreen");
            await verileriYenile();
        }

        function cikisYap() {
            localStorage.removeItem("rp_role");
            ekranDegistir("formScreen");
            loginPopoverGoster(false);
        }

        async function basvuruGonder(event) {
            event.preventDefault();
            if (!document.getElementById("rpForm").reportValidity()) return;

            if (!supabaseConfigured) {
                alert("Başvuruları kaydetmek için dosyadaki Supabase URL ve anon key alanlarını yapılandırın.");
                return;
            }

            const type = document.getElementById("registrationType").value;
            const isStaff = type === "Moderatör" || type === "Yetkili";
            const isWhitelist = type === "Whitelist";
            const answers = [
                `Deneyim ve motivasyon:\n${document.getElementById("experience").value.trim()}`,
                `Ek bilgiler:\n${document.getElementById("strengths").value.trim() || "Belirtilmedi"}`,
                `Haftalık aktiflik:\n${document.getElementById("availability").value}`,
                `Çevrimiçi olduğu zamanlar:\n${document.getElementById("playTime").value.trim() || "Belirtilmedi"}`,
                `Anlaşmazlık yaklaşımı:\n${document.getElementById("scenario").value.trim()}`
            ];

            if (isStaff) {
                answers.push(
                    `Ekip deneyimi ve motivasyon:\n${document.getElementById("moderationExperience").value.trim()}`,
                    `Durum değerlendirme yaklaşımı:\n${document.getElementById("moderatorScenario").value.trim()}`
                );
            }
            if (isWhitelist) {
                answers.push(
                    `Karakter geçmişi:\n${document.getElementById("characterStory").value.trim()}`,
                    `Karakter hedefleri:\n${document.getElementById("characterGoals").value.trim()}`
                );
            }

            const application = {
                discord_adi: document.getElementById("discordName").value.trim(),
                yas: Number(document.getElementById("age").value),
                karakter_adi: document.getElementById("charName").value.trim(),
                deneyim: answers.join("\n\n"),
                form_turu: type
            };

            const submitButton = document.getElementById("submitButton");
            submitButton.disabled = true;
            try {
                const { error } = await supabaseClient.from("basvurular").insert([application]);
                if (error) throw error;
                alert("Başvurun başarıyla gönderildi. İnceleme tamamlandığında sana ulaşacağız.");
                document.getElementById("rpForm").reset();
                formAlanlariniGuncelle();
            } catch (error) {
                alert("Başvuru gönderilemedi: " + error.message);
            } finally {
                gondermeDurumunuGuncelle();
            }
        }

        function klasorDegistir(tur) {
            aktifKlasor = tur;
            applicationTypes.forEach((type) => {
                const buttonId = { Oyuncu: "folderOyuncu", Whitelist: "folderWhitelist", Moderatör: "folderMod", Yetkili: "folderYetkili", Verifyed: "folderVerifyed" , Security: "folderSecurity", Terorist: "folderTerorist", Obur: "folderObur" }[type];
                document.getElementById(buttonId).classList.toggle("active", tur === type);
            });
            document.getElementById("thDinamik").textContent = tur === "Oyuncu" || tur === "Whitelist" ? "Karakter adı" : "Başvuru alanı";
            verileriYenile();
        }

        async function verileriYenile() {
            const tbody = document.getElementById("basvuruListesi");
            const connectionNotice = document.getElementById("adminConnectionNotice");
            if (!supabaseConfigured) {
                connectionNotice.textContent = "Başvuruları görüntülemek için script bölümündeki SUPABASE_URL ve SUPABASE_ANON_KEY değerlerini Supabase projenizin bilgileriyle doldurun. Bu bilgiler ayarlanmadan gönderilen başvurular bu panelden okunamaz.";
                connectionNotice.classList.remove("hidden");
                tbody.innerHTML = '<tr><td colspan="5">Supabase bağlantısı yapılandırılmadı; başvurular yüklenemiyor.</td></tr>';
                return;
            }

            connectionNotice.classList.add("hidden");
            tbody.innerHTML = '<tr><td colspan="5">Başvurular yükleniyor...</td></tr>';
            try {
                const { data, error } = await supabaseClient
                    .from("basvurular")
                    .select("*")
                    .order("created_at", { ascending: false });
                if (error) throw error;

                const applications = data || [];
                document.getElementById("countOyuncu").textContent = applications.filter((item) => item.form_turu === "Oyuncu").length;
                document.getElementById("countWhitelist").textContent = applications.filter((item) => item.form_turu === "Whitelist").length;
                document.getElementById("countMod").textContent = applications.filter((item) => item.form_turu === "Moderatör").length;
                document.getElementById("countYetkili").textContent = applications.filter((item) => item.form_turu === "Yetkili").length;
                document.getElementById("countVerifyed").textContent = applications.filter((item) => item.form_turu === "Verifyed").length;
                document.getElementById("countSecurity").textContent = applications.filter((item) => item.form_turu === "Security").length;
                document.getElementById("countTerorist").textContent = applications.filter((item) => item.form_turu === "Terorist").length;
                document.getElementById("countObur").textContent = applications.filter((item) => item.form_turu === "Obur üye").length;
                const filtered = applications.filter((item) => item.form_turu === aktifKlasor);

                if (filtered.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Bu klasörde henüz başvuru yok.</td></tr>';
                    return;
                }

                tbody.innerHTML = filtered.map((item) => {
                    const status = item.durum || "Beklemede";
                    const fieldValue = aktifKlasor === "Oyuncu" || aktifKlasor === "Whitelist"
                        ? item.karakter_adi
                        : item.karakter_adi || `${aktifKlasor} başvurusu`;
                    const statusOptions = ["Beklemede", "Onaylandı", "Reddedildi"];
                    const options = statusOptions.map((option) =>
                        `<option value="${option}" ${status === option ? "selected" : ""}>${option}</option>`
                    ).join("");
                    return `<tr>
                        <td>${escapeHtml(item.discord_adi)}</td>
                        <td>${escapeHtml(item.yas)}</td>
                        <td>${escapeHtml(fieldValue)}</td>
                        <td><span class="badge ${escapeHtml(status)}">${escapeHtml(status)}</span></td>
                        <td><select class="status-select" aria-label="Başvuru durumunu değiştir" onchange="durumGuncelle(${Number(item.id)}, this.value)">${options}</select></td>
                    </tr>
                    <tr class="details-row"><td colspan="5"><details><summary>Başvuru yanıtlarını görüntüle</summary>${escapeHtml(item.deneyim)}</details></td></tr>`;
                }).join("");
            } catch (error) {
                connectionNotice.textContent = "Başvurular alınamadı: " + error.message + " Supabase bağlantısını, basvurular tablosunu ve tablo izinlerini kontrol edin.";
                connectionNotice.classList.remove("hidden");
                tbody.innerHTML = '<tr><td colspan="5">Başvurular yüklenemedi. Ayrıntı için bağlantı uyarısına bakın.</td></tr>';
                console.error("Başvurular alınırken hata oluştu:", error);
            }
        }

        async function durumGuncelle(id, yeniDurum) {
            if (!id || !["Beklemede", "Onaylandı", "Reddedildi"].includes(yeniDurum)) return;
            const { error } = await supabaseClient.from("basvurular").update({ durum: yeniDurum }).eq("id", id);
            if (error) {
                alert("Başvuru durumu güncellenemedi: " + error.message);
                return;
            }
            await verileriYenile();
        }

        document.getElementById("registrationType").addEventListener("change", formAlanlariniGuncelle);
        document.getElementById("rpForm").addEventListener("submit", basvuruGonder);
        document.getElementById("rpForm").addEventListener("input", gondermeDurumunuGuncelle);
        document.getElementById("rpForm").addEventListener("change", gondermeDurumunuGuncelle);
        document.getElementById("loginPopover").addEventListener("submit", yetkiliGirisi);
        document.getElementById("loginToggle").addEventListener("click", () => {
            const isExpanded = document.getElementById("loginToggle").getAttribute("aria-expanded") === "true";
            loginPopoverGoster(!isExpanded);
        });
        document.addEventListener("click", (event) => {
            const loginArea = document.querySelector(".login-area");
            if (!loginArea.contains(event.target)) loginPopoverGoster(false);
        });

        formAlanlariniGuncelle();
        gondermeDurumunuGuncelle();
        if (localStorage.getItem("rp_role") === "admin") {
            ekranDegistir("adminPanelScreen");
            verileriYenile();
        }
