(function () {
    const SLOT_COUNT = 5;

    function normalizeState(stickers) {
        if (!window.renderer3dContract) {
            return [];
        }

        return window.renderer3dContract.createEditorState({ stickers }).stickers;
    }

    class StickerEditor {
        constructor(options) {
            this.container = options.container;
            this.onChange = options.onChange;
            this.stickers = [];
            this.bound = false;
        }

        bindEvents() {
            if (this.bound) {
                return;
            }

            const slotSelect = this.container.querySelector('[data-sticker-slot]');
            const applyBtn = this.container.querySelector('[data-sticker-apply]');
            const removeBtn = this.container.querySelector('[data-sticker-remove]');
            const resetBtn = this.container.querySelector('[data-sticker-reset]');

            if (slotSelect) {
                slotSelect.addEventListener('change', () => {
                    this.renderFormForSlot(Number(slotSelect.value || 0));
                });
            }

            if (applyBtn) {
                applyBtn.addEventListener('click', () => {
                    this.applyCurrentSlot();
                });
            }

            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    this.removeCurrentSlot();
                });
            }

            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    this.resetAll();
                });
            }

            this.bound = true;
        }

        mount(stickers) {
            this.bindEvents();
            this.stickers = normalizeState(stickers);
            this.renderFormForSlot(0);
            this.renderSummary();
            this.emitChange();
        }

        destroy() {
            this.stickers = [];
            this.renderSummary();
        }

        getStickers() {
            return normalizeState(this.stickers);
        }

        getActiveSlot() {
            const slotSelect = this.container.querySelector('[data-sticker-slot]');
            return Number(slotSelect ? slotSelect.value : 0);
        }

        getInput(name) {
            return this.container.querySelector(`[data-sticker-input="${name}"]`);
        }

        readFormValues() {
            return {
                slot: this.getActiveSlot(),
                stickerId: this.getInput('id')?.value || '',
                rotation: Number(this.getInput('rotation')?.value || 0),
                scale: Number(this.getInput('scale')?.value || 1),
                wear: Number(this.getInput('wear')?.value || 0),
                position: {
                    x: Number(this.getInput('x')?.value || 0),
                    y: Number(this.getInput('y')?.value || 0)
                }
            };
        }

        applyCurrentSlot() {
            const values = this.readFormValues();
            if (!values.stickerId.trim()) {
                return;
            }

            const nextStickers = this.stickers.filter((entry) => entry.slot !== values.slot);
            nextStickers.push(values);
            this.stickers = normalizeState(nextStickers);
            this.renderSummary();
            this.renderFormForSlot(values.slot);
            this.emitChange();
        }

        removeCurrentSlot() {
            const slot = this.getActiveSlot();
            this.stickers = this.stickers.filter((entry) => entry.slot !== slot);
            this.renderSummary();
            this.renderFormForSlot(slot);
            this.emitChange();
        }

        resetAll() {
            this.stickers = [];
            this.renderSummary();
            this.renderFormForSlot(this.getActiveSlot());
            this.emitChange();
        }

        renderFormForSlot(slot) {
            const slotSelect = this.container.querySelector('[data-sticker-slot]');
            if (slotSelect) {
                slotSelect.value = String(slot);
            }

            const existing = this.stickers.find((entry) => entry.slot === slot);
            const values = existing || {
                stickerId: '',
                rotation: 0,
                scale: 1,
                wear: 0,
                position: { x: 0, y: 0 }
            };

            if (this.getInput('id')) this.getInput('id').value = values.stickerId;
            if (this.getInput('rotation')) this.getInput('rotation').value = String(values.rotation);
            if (this.getInput('scale')) this.getInput('scale').value = String(values.scale);
            if (this.getInput('wear')) this.getInput('wear').value = String(values.wear);
            if (this.getInput('x')) this.getInput('x').value = String(values.position.x);
            if (this.getInput('y')) this.getInput('y').value = String(values.position.y);
        }

        renderSummary() {
            const summary = this.container.querySelector('[data-sticker-summary]');
            if (!summary) {
                return;
            }

            if (!this.stickers.length) {
                summary.innerHTML = '<small class="text-secondary">No stickers set.</small>';
                return;
            }

            const rows = this.stickers
                .sort((a, b) => a.slot - b.slot)
                .map((entry) => {
                    return `<span class="badge text-bg-primary me-1 mb-1">Slot ${entry.slot + 1}: ${entry.stickerId}</span>`;
                });

            summary.innerHTML = rows.join('');
        }

        emitChange() {
            if (typeof this.onChange === 'function') {
                this.onChange(this.getStickers());
            }
        }
    }

    window.createStickerEditor = function createStickerEditor(options) {
        if (!options || !options.container) {
            return null;
        }

        return new StickerEditor(options);
    };
})();
