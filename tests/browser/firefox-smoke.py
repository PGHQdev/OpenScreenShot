"""Real Firefox capture-controller smoke, using a disposable browser profile.

Build/package first. Install requirements-firefox.txt, then run this script.
FIREFOX_BIN optionally selects a Firefox executable; Selenium locates it otherwise.
"""

import http.server
import json
import os
from pathlib import Path
import tempfile
import threading

from selenium import webdriver
from selenium.common.exceptions import NoSuchWindowException
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.support.ui import WebDriverWait

ROOT = Path(__file__).resolve().parents[2]
VERSION = json.loads((ROOT / 'package.json').read_text())['version']
ADDON_ID = 'openscreenshot@pghq.dev'


class Fixture(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.end_headers()
        self.wfile.write(b'<!doctype html><title>Firefox Capture Fixture</title>'
                        b'<body style="margin:0"><h1>Firefox screenshot smoke</h1>'
                        b'<article id="element-card" style="position:absolute;left:80px;top:140px;'
                        b'width:240px;height:160px;background:rgb(241,243,245)">'
                        b'<div style="position:absolute;left:60px;top:40px;width:120px;height:80px;'
                        b'background:rgb(36,133,75)"></div></article>'
                        b'<div style="height:2300px;background:linear-gradient(#f4d5b7,#335588)">'
                        b'Scrollable capture fixture</div><footer>Bottom of page</footer>')

    def log_message(self, *_args):
        pass


def main():
    server = http.server.HTTPServer(('127.0.0.1', 0), Fixture)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    with tempfile.TemporaryDirectory(prefix='oss-firefox-downloads-') as downloads:
        options = Options()
        if os.environ.get('FIREFOX_BIN'):
            options.binary_location = os.environ['FIREFOX_BIN']
        options.add_argument('-headless')
        options.set_preference('browser.download.folderList', 2)
        options.set_preference('browser.download.dir', downloads)
        options.set_preference('browser.download.useDownloadDir', True)
        options.set_preference('browser.helperApps.neverAsk.saveToDisk', 'application/pdf,image/png')
        options.set_preference('pdfjs.disabled', True)
        driver = webdriver.Firefox(options=options, service=Service(service_args=['--allow-system-access']))
        driver.set_window_size(1100, 900)
        driver.set_script_timeout(20)
        wait = WebDriverWait(driver, 30)

        def api(script, *args):
            return driver.execute_async_script(
                'const done=arguments[arguments.length-1];'
                '(async()=>{' + script + '})().then(done,e=>done({error:String(e)}));', *args)

        def history():
            return api('return (await chrome.storage.local.get("openscreenshot:captures"))["openscreenshot:captures"] || [];')

        def new_editor(previous, via_progress=False):
            def find_page(path):
                for handle in set(driver.window_handles) - previous:
                    try:
                        driver.switch_to.window(handle)
                        if path in driver.current_url:
                            return handle
                    except NoSuchWindowException:
                        continue
                return False

            if via_progress:
                dialog = wait.until(lambda _d: find_page('/src/progress/index.html'))
                button = wait.until(lambda d: next(iter(d.find_elements(
                    By.CSS_SELECTOR, '#open:not([hidden])')), False))
                assert button.text == 'Open editor', button.text
                button.click()
            wait.until(lambda _d: find_page('/src/editor/index.html'))
            wait.until(lambda d: d.find_elements(By.CSS_SELECTOR, 'canvas'))
            if via_progress:
                wait.until(lambda d: dialog not in d.window_handles)

        try:
            driver.install_addon(str(ROOT / f'openscreenshot-firefox-v{VERSION}.zip'), temporary=True)
            driver.set_context('chrome')
            uuids = json.loads(driver.execute_script('return Services.prefs.getCharPref("extensions.webextensions.uuids")'))
            base = 'moz-extension://' + uuids[ADDON_ID]
            driver.set_context('content')
            driver.get(base + '/src/popup/index.html')
            # Opening the popup as a tab is itself an extension URL: restricted.
            wait.until(lambda d: d.find_elements(By.CSS_SELECTOR, '.restricted-page'))
            assert not driver.find_elements(By.CSS_SELECTOR, '[data-testid="rec-start"]')
            assert 'This page can’t be captured' in driver.find_element(By.TAG_NAME, 'body').text
            permissions = api('return chrome.permissions.getAll();')
            assert 'offscreen' not in permissions['permissions']
            assert 'tabCapture' not in permissions['permissions']
            driver.get(f'http://127.0.0.1:{server.server_port}')
            fixture_handle = driver.current_window_handle
            previous = set(driver.window_handles)
            # Click the real toolbar action to grant activeTab (no broad host grant).
            driver.set_context('chrome')
            driver.execute_script('''
                let ui;
                try { ui=ChromeUtils.importESModule("moz-src:///browser/components/customizableui/CustomizableUI.sys.mjs"); }
                catch { ui=ChromeUtils.importESModule("resource:///modules/CustomizableUI.sys.mjs"); }
                ui.CustomizableUI.addWidgetToArea("openscreenshot_pghq_dev-browser-action",ui.CustomizableUI.AREA_NAVBAR);
            ''')
            driver.find_element(By.ID, 'openscreenshot_pghq_dev-BAP').click()
            driver.set_context('content')
            new_editor(previous, via_progress=True)
            entry = history()[0]
            assert entry['mode'] == 'full-page' and entry['height'] >= 2300, entry
            assert entry['thumbnail'].startswith('data:image/jpeg;base64,')

            # Exercise export and clipboard through the editor's real buttons.
            copy = driver.find_element(By.XPATH, '//button[normalize-space()="Copy"]')
            copy.click()
            wait.until(lambda _d: copy.text == 'Copied')
            driver.find_element(By.XPATH, '//button[normalize-space()="PDF"]').click()
            wait.until(lambda _d: any(Path(downloads).glob('*.pdf')))
            pdf = next(Path(downloads).glob('*.pdf'))
            wait.until(lambda _d: pdf.stat().st_size > 100)
            assert pdf.read_bytes().startswith(b'%PDF-')

            driver.find_element(By.XPATH, '//button[normalize-space()="Save image"]').click()
            wait.until(lambda d: d.find_element(By.CSS_SELECTOR, '.btn-fixed-export').is_displayed())
            driver.find_element(By.XPATH, '//button[contains(@class,"format-card")][.//span[normalize-space()="PNG"]]').click()
            driver.find_element(By.CSS_SELECTOR, '.btn-fixed-export').click()
            wait.until(lambda d: any(Path(downloads).glob('*.png')) or d.find_elements(By.CSS_SELECTOR, '.export-error'))
            assert not driver.find_elements(By.CSS_SELECTOR, '.export-error'), 'Image export failed'
            png = next(Path(downloads).glob('*.png'))
            wait.until(lambda _d: png.stat().st_size > 100)
            assert png.read_bytes().startswith(bytes([137,80,78,71,13,10,26,10]))

            for mode in ['visible', 'region', 'element']:
                previous = set(driver.window_handles)
                # The toolbar click granted this fixture's activeTab permission.
                # The message exercises the same controller used by the popup.
                api('''
                    const tabs=await chrome.tabs.query({});
                    const target=tabs.find(t=>t.url?.startsWith(arguments[0]));
                    await chrome.storage.local.set({"openscreenshot:last-region":{x:20,y:20,width:200,height:100}});
                    await chrome.tabs.update(target.id,{active:true});
                    await chrome.runtime.sendMessage({type:"CAPTURE_REQUEST",mode:arguments[1],repeat:arguments[1]==="region"});
                ''', f'http://127.0.0.1:{server.server_port}', mode)
                driver.switch_to.window(fixture_handle)
                if mode == 'element':
                    wait.until(lambda d: d.find_elements(
                        By.CSS_SELECTOR, '[data-openscreenshot-element-picker]'))
                    card = driver.find_element(By.ID, 'element-card')
                    expected = driver.execute_script('''
                        const rect=arguments[0].getBoundingClientRect(), dpr=devicePixelRatio;
                        return {
                            width:Math.round(rect.right*dpr)-Math.round(rect.left*dpr),
                            height:Math.round(rect.bottom*dpr)-Math.round(rect.top*dpr)
                        };
                    ''', card)
                    # Hover the card background, outside its smaller colored child.
                    ActionChains(driver).move_to_element_with_offset(card, -100, -60).perform()
                    wait.until(lambda d: d.execute_script('''
                        const root=document.querySelector('[data-openscreenshot-element-picker]')?.shadowRoot;
                        const selected=root?.querySelector('[data-selection]');
                        if (!selected || selected.hidden) return false;
                        const rect=selected.getBoundingClientRect();
                        return rect.width===240 && rect.height===160;
                    '''))
                    ActionChains(driver).send_keys(Keys.ENTER).perform()
                new_editor(previous)
                entry = history()[0]
                assert entry['mode'] == mode, entry
                if mode == 'region':
                    assert entry['width'] == 200 and entry['height'] == 100, entry
                elif mode == 'element':
                    assert entry['width'] == expected['width'] and entry['height'] == expected['height'], entry
                    # Decode the stored capture, rather than the editor's scaled canvas.
                    pixels = api('''
                        const key="openscreenshot:capture-image:"+arguments[0];
                        const image=new Image();
                        image.src=(await chrome.storage.local.get(key))[key];
                        await image.decode();
                        const canvas=document.createElement("canvas");
                        canvas.width=image.naturalWidth; canvas.height=image.naturalHeight;
                        const ctx=canvas.getContext("2d");
                        ctx.drawImage(image,0,0);
                        const sample=(x,y)=>Array.from(ctx.getImageData(x,y,1,1).data);
                        return {
                            width:canvas.width,height:canvas.height,
                            corners:[sample(0,0),sample(canvas.width-1,0),
                                     sample(0,canvas.height-1),sample(canvas.width-1,canvas.height-1)],
                            center:sample(Math.floor(canvas.width/2),Math.floor(canvas.height/2))
                        };
                    ''', entry['id'])
                    assert pixels['width'] == expected['width'] and pixels['height'] == expected['height'], pixels
                    assert pixels['corners'] == [[241, 243, 245, 255]] * 4, pixels
                    assert pixels['center'] == [36, 133, 75, 255], pixels
                else:
                    assert 0 < entry['height'] < 2300, entry
            assert len(history()) == 4
            # Quick-save exercises blob downloads in Firefox's background page.
            existing_pngs = set(Path(downloads).glob('*.png'))
            result = api('''
                const tabs=await chrome.tabs.query({});
                const target=tabs.find(t=>t.url?.startsWith(arguments[0]));
                const stored=await chrome.storage.local.get("openscreenshot:settings");
                await chrome.storage.local.set({"openscreenshot:settings":{...stored["openscreenshot:settings"],captureAction:"download"}});
                await chrome.tabs.update(target.id,{active:true});
                await chrome.runtime.sendMessage({type:"CAPTURE_REQUEST",mode:"visible"});
                return true;
            ''', f'http://127.0.0.1:{server.server_port}')
            assert result is True, result
            wait.until(lambda _d: bool(set(Path(downloads).glob('*.png')) - existing_pngs))
            saved = next(iter(set(Path(downloads).glob('*.png')) - existing_pngs))
            wait.until(lambda _d: saved.stat().st_size > 100)
            assert saved.read_bytes().startswith(bytes([137,80,78,71,13,10,26,10]))
            print(f'PASS Firefox {driver.capabilities["browserVersion"]}: full-page, visible, repeat-region, element (exact dimensions and clean pixels), editor, history, clipboard, PNG, PDF, quick-save')
        except Exception:
            print('Firefox smoke failure:', driver.find_element(By.TAG_NAME, 'body').text[-2500:], flush=True)
            print('Downloads:', list(Path(downloads).iterdir()), flush=True)
            raise
        finally:
            driver.quit()
            server.shutdown()


if __name__ == '__main__':
    main()
