﻿/// <reference path="references.d.ts" />

//
// ここにIExtensionを実装したクラス(実装してなくても)をペコペコ並べると勝手に読み込みます。
//
module ChatworkExtension.Extensions {
    declare var chrome: any;

    /**
     * CSSを差し込む (ChatworkのCSSより後に差し込みたいのでこうなってる)
     * Chatworkが起動する前に読み込みたいのはstyle_before.cssに。
     */
    export class InjectCustomStylesheets extends ChatworkExtension.ExtensionBase {
        static metadata = {
            description: "カスタムスタイルシートを提供します。この拡張を無効にした場合、他の拡張に影響が出る場合があります。",
            advanced: true
        }
        onReady(): void {
            var styleE = document.createElement('link');
            styleE.rel = 'stylesheet';
            styleE.href = chrome.extension.getURL('style.css');
            window.document.head.appendChild(styleE);

            //(<HTMLElement>window.document.querySelector('#_sideContentTitle')).style.height = '0';
        }
    }

    /**
     * ユーザーカスタムスクリプトを差し込む
     */
    export class InjectUserCustomScripts extends ChatworkExtension.ExtensionBase {
        static metadata = {
            description: "ユーザーカスタムスクリプトを差し込む機能を提供します。",
            advanced: true,
            extraSettingType: ExtraSettingType.TextArea,
            extraSettingLocalOnly: true
        }
        onReady(): void {
        }
    }

    /**
     * ユーザーCSSを差し込む
     */
    export class InjectUserCustomStylesheets extends ChatworkExtension.ExtensionBase {
        static metadata = {
            description: "ユーザーCSSを差し込む機能を提供します。",
            advanced: true,
            extraSettingType: ExtraSettingType.TextArea,
            extraSettingLocalOnly: true
        }
        onReady(): void {
            chrome.runtime.sendMessage({ method: 'readStorage', arguments: ['InjectUserCustomStylesheets'] }, (result: string) => {
                if (result != null) {
                    var styleE = document.createElement('style');
                    styleE.textContent = result;
                    window.document.head.appendChild(styleE);
                }
            });
        }
    }

    /**
     * Webページコンテキストで動くカスタムスクリプトを差し込む
     */
    export class InjectWebPageContextCustomScripts extends ChatworkExtension.ExtensionBase {
        static metadata = {
            hidden: true
        }

        onReady(): void {
            ['chatworkextension.customscripts.js'].forEach(function (src) {
                var script = document.createElement('script');
                script.type = 'text/javascript';
                script.src = chrome.extension.getURL(src);
                window.document.body.appendChild(script);
            });

            // MigemoJS
            var scriptE = document.createElement('script');
            scriptE.type = 'text/javascript';
            scriptE.src = chrome.extension.getURL('migemojs/migemo.js');
            scriptE.id = 'script-migemojs';
            window.document.body.appendChild(scriptE);

            // jquery-textcomplete
            var scriptE2 = document.createElement('script');
            scriptE2.type = 'text/javascript';
            scriptE2.src = chrome.extension.getURL('jquery-textcomplete/jquery.textcomplete.min.js');
            scriptE2.id = 'script-jquery-textcomplete';
            window.document.body.appendChild(scriptE2);
        }
    }

    /**
     * グループリストの高さを縮める
     */
    export class GroupListAlwaysSortedByName extends ChatworkExtension.ExtensionBase {
        static metadata = {
            description: "グループリストを常に名前でソートします。",
            disableByDefault: true
        }

        onReady(): void {
            document.body.classList.add('__x-GroupListAlwaysSortedByName-enabled');
        }
    }

    /**
     * グループリストの高さを縮める
     */
    export class ResizeGroupListHeight extends ChatworkExtension.ExtensionBase {
        static metadata = {
            description: "グループリストの高さを縮める変更を提供します。"
        }

        onReady(): void {
            document.body.classList.add('__x-ResizeGroupListHeight-enabled');
        }
    }

    /**
     * チャットテキスト入力エリアでメンバー名の補完を提供
     */
    export class MemberCompletionInTextArea extends ChatworkExtension.ExtensionBase {
        static metadata = {
            description: "チャットテキスト入力エリアでメンバー名の補完を提供します。"
        }

        onReady(): void {
            document.body.classList.add('__x-MemberCompletionInTextArea-enabled');
        }
    }

    /**
     * グループのインクリメンタルな絞り込み
     */
    export class IncrementalGroupFilter extends ChatworkExtension.ExtensionBase {
        static metadata = {
            description: "グループのインクリメンタルな絞り込み機能を提供します。"
        }

        _inputE: HTMLInputElement;
        _filterRe: RegExp;

        onReady(): void {
            var filterMenuE = document.getElementById('_chatFilterMenu');
            filterMenuE.style.height = '74px';
        }

        onChatworkReady(): void {
            this._inputE = document.createElement('input');
            this._inputE.style.left = '3px';
            this._inputE.style.top = '40px';
            this._inputE.style.width = '95%';
            this._inputE.style.position = 'absolute';
            this._inputE.type = 'search';
            this._inputE.placeholder = 'グループ名で検索'; // FIXME: placeholder属性をlabelとして使うとか最低最悪なのでいつか直す

            this._inputE.addEventListener('change', () => this.updateFilter());
            this._inputE.addEventListener('keyup', () => this.updateFilter());

            var filterMenuE = document.getElementById('_chatFilterMenu');
            filterMenuE.style.height = '74px';
            filterMenuE.appendChild(this._inputE);
        }

        onGroupAppear(element: HTMLElement): void {
            if (this._filterRe == null) {
                return;
            }
            var label = element.getAttribute('aria-label');
            element.style.display = this._filterRe && this._filterRe.test(label) ? '' : 'none';
        }

        private updateFilter(): void {
            var value = this._inputE.value;

            if (value != null && value != '') {
                var migemoRe = (<any>window).MigemoJS.getRegExp(value);
                this._filterRe = new RegExp((migemoRe ? migemoRe + '|' : '') + value, 'i');
                [].forEach.call(document.querySelectorAll('#_roomListItems > li'), (liE: HTMLLIElement) => {
                    var label = liE.getAttribute('aria-label');
                    liE.style.display = this._filterRe.test(label) ? '' : 'none';
                });
            } else {
                this._filterRe = null;
                [].forEach.call(document.querySelectorAll('#_roomListItems > li'), (liE: HTMLLIElement) => {
                    liE.style.display = '';
                });
            }
        }
    }

    /**
     * ピンしているやつにクラスを付ける
     */
    export class AddPinnedGroups extends ChatworkExtension.ExtensionBase {
        static metadata = {
            hidden: true
        };

        onGroupAppear(element: HTMLElement): void {
            var pin = <HTMLElement>element.querySelector('.roomListItem__pin');
            if (pin == null) {
                return;
            }
            if (pin.classList.contains('roomListItem__pin--checked')) {
                element.classList.add('__x-pinnedLink');
            }
        }
    }

    
    /**
     * ピンしているやつにクラスを付ける
     */
    export class AddMention extends ChatworkExtension.ExtensionBase {
        static metadata = {
            hidden: true
        };

        onGroupAppear(element: HTMLElement): void {
            var badge = <HTMLElement>element.querySelector('.roomListBadges__mentionBadge');
            if (badge == null) {
                element.classList.add('__x-hasMention');
            }
        }
    }

    /**
     * シンタックスハイライトするよ
     */
    export class SyntaxHighlighter extends ChatworkExtension.ExtensionBase {
        static metadata = {
            description: "コードのシンタックスハイライトを提供します。"
        }

        onReady(): void {
            var styleE = document.createElement('link');
            styleE.rel = 'stylesheet';
            styleE.href = chrome.extension.getURL('highlightjs/styles/vs.css');
            window.document.head.appendChild(styleE);

            var scriptE = document.createElement('script');
        }

        onChatMessageReceived(element: HTMLElement): void {
            // [code]...[/code]
            var codes = element.querySelectorAll('code.chatCode');
            [].forEach.call(codes, (elem: HTMLElement) => {
                elem.classList.add('hljs');
                elem.innerHTML = (<any>window).hljs.highlightAuto(elem.textContent).value;
            });

            // ```...```
            var pres = element.querySelectorAll('pre');
            [].forEach.call(pres, (elem: HTMLPreElement) => {
                if (elem.innerHTML.indexOf('```') == -1) {
                    return;
                }
                elem.innerHTML = (<any>elem.innerHTML).replace(/^```([^\n]*)([\s\S]*?)^```|^C#\s+([\s\S]*)/mg, (match: any, type: any, code: any, code2: any) => {
                    var languages: string[];
                    code = code || code2;
                    if (type) {
                        languages = [type];
                    }
                    if (code2) {
                        languages = ['cs'];
                    }
                    var unescapedCode = code.replace(/^\n+/, '')
                        .replace(/<img .*?alt=(["'])(.*?)\1[^>]*>/g, '$2')
                        .replace(/<a .*?href=(["'])(.*?)\1[^>]*>.*?<\/a>/g, '$2')
                        .replace(/<a .*?_previewLink[^>]*>.*?<\/a>/g, '')
                        .replace(/<[^>]+>/g, '')
                        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');

                    return "<code style='' class='hljs __x-syntaxhighlight-code'>" + (code2 ? 'C# ' : '') + (<any>window).hljs.highlightAuto(unescapedCode, languages).value + "</code>";
                });
            });
        }
    }

    /**
     * フラットスタイル
     */
    export class FlatStyle extends ChatworkExtension.ExtensionBase {
        static metadata = {
            description: "フラットスタイルを提供します。"
        }

        onReady(): void {
            document.body.classList.add('__x-FlatStyle-enabled');
        }
    }
    /**
     * Toリストの検索を拡張(Migemo)
     */
    export class MigemizeToList extends ChatworkExtension.ExtensionBase {
        static metadata = {
            description: "Toリストの検索を拡張する機能を提供します。"
        }

        onReady(): void {
            document.body.classList.add('__x-MigemizeToList-enabled');
        }
    }

    /**
     * プレビューダイアログをクリックシールド部分をクリックしても閉じる
     */
    export class ClosePreviewDialogOnBackgroundClicked extends ChatworkExtension.ExtensionBase {
        static metadata = {
            description: "プレビューダイアログの背景部分をクリックしても閉じる機能を提供します。"
        }

        onReady(): void {
            document.body.classList.add('__x-ClosePreviewDialogOnBackgroundClicked-enabled');
        }
    }

    /**
     * キーワード反応
     */
    export class KeywordHighlight extends ChatworkExtension.ExtensionBase {
        static metadata = {
            description: "キーワード機能を提供します。改行でキーワードを区切ることで複数指定できます。",
            extraSettingType: ExtraSettingType.TextArea
        }

        keywordRe: RegExp;

        onReady(): void {
            var values = (this.extraSettingValue || '').replace(/^\s+|\s+$/g, '');
            if (values) {
                this.keywordRe = new RegExp(values.replace(/\r?\n/g, '|'), "i");
            }
        }

        onChatMessageReceived(element: HTMLElement): void {
            if (this.keywordRe) {
                if (this.keywordRe.test(element.querySelector('pre').textContent)) {
                    element.classList.add('x-keyword-highlighted');
                    element.classList.add('chatTimeLineMessageMention');
                }
            }
        }
    }

    /**
     * テキストのレスポンスヘッダーを強制的にShift_JISにする
     */
    export class RewriteTextResponseContentTypeCharsetShiftJis extends ChatworkExtension.ExtensionBase {
        static metadata = {
            description: "テキストのレスポンスヘッダーを強制的にShift_JISにする機能を提供します。",
            disableByDefault: true
        }

        onReady(): void {
            chrome.runtime.sendMessage({ method: 'startTextResponseHeaderCharsetFilter', arguments: [] }, (result: string) => { });
        }
    }
}