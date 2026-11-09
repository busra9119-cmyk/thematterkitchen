# THE MATTER KITCHEN — GitHub Pages sürümü

Bu klasör, oyunun **v28 + alt logo** sürümünü içerir. GitHub Pages üzerinde statik olarak yayınlanabilir.

## GitHub'a yükleme

1. GitHub'da yeni bir **Public** repository oluşturun (örneğin `matter-kitchen`).
2. ZIP dosyasını bilgisayarınızda açın.
3. **Bu klasörün içindekileri** (`index.html`, `assets/`, `README.md`, `.nojekyll`) repository'nin **kök dizinine** yükleyin. ZIP'in kendisini yüklemeyin.
4. Repository'de **Settings → Pages → Build and deployment → Deploy from a branch** yolunu açın.
5. Branch: **main**, Folder: **/(root)** seçip **Save** edin.
6. GitHub Pages size `https://KULLANICI.github.io/REPO-ADI/` biçiminde bir bağlantı verecektir.

**Önemli:** `index.html` repository'nin ana dizininde olmalıdır; ayrı bir alt klasör içinde kalırsa oyun ana adresten açılmaz. `assets/` klasörünün adını ve içeriğini değiştirmeyin.

## Logo

Alt orta bölümde onaylanan **THE MATTER KITCHEN** PNG logosu görünür. Görsel `assets/matter_kitchen_footer_logo.png` dosyasında bulunur. Başka bir görselle değiştirmek için aynı isimle yenisini koyabilirsiniz.

## Oyun özellikleri

- 60 açık uçlu, karıştırılan soru; öğretmen Settings bölümünden düzenleyebilir.
- Dört şef, her biri altı yemek aşaması, doğru/yanlış animasyonları ve kutlama.
- Şef başına en fazla iki yazılı Kitchen Surprise; Next Team kontrolü.
- Ses efektleri, hafif arka plan müziği ve ayrı ses ayarları.
- Fullscreen ve dört şefin final ekranı.
- Fontlar Luckiest Guy ve Ranchers; bunların yüklenmesi için internet bağlantısı gerekir (çevrimdışı yedek font kullanılır).

## Öğretmen düzenlemeleri

Teacher Settings üzerinden kaydedilen değişiklikler **yalnızca değişikliğin yapıldığı tarayıcıda/cihazda** saklanır (localStorage). GitHub'daki soru dosyasını otomatik olarak değiştirmez. Yedekleme/diğer cihaza aktarma için **Export JSON / Import JSON** kullanın.

## Yerelde açma

`index.html` dosyasını Chrome'da açabilirsiniz. Sesler tarayıcı kuralları gereği genellikle ilk kullanıcı etkileşiminden sonra başlar.
