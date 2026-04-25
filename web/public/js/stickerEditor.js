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
            this.activeSlot = 0;
        }

        bindEvents() {
            if (this.bound) {
                return;
            }

            const slotSelect = this.container.querySelector('[data-sticker-slot]');
            const applyBtn = this.container.querySelector('[data-sticker-apply]');
            const removeBtn = this.container.querySelector('[data-sticker-remove]');
            const resetBtn = this.container.querySelector('[data-sticker-reset]');
            const chips = this.container.querySelectorAll('[data-sticker-chip]');
            const advancedToggle = this.container.querySelector('[data-sticker-advanced-toggle]');

            if (slotSelect) {
                slotSelect.addEventListener('change', () => {
                    this.setActiveSlot(Number(slotSelect.value || 0));
                });
            }

            if (chips && chips.length) {
                chips.forEach((chip) => {
                    chip.addEventListener('click', () => {
                        this.setActiveSlot(Number(chip.dataset.stickerChip || 0));
                    });
                });
            }

            if (advancedToggle) {
                advancedToggle.addEventListener('click', () => {
                    this.container.classList.toggle('advanced-open');
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

        setActiveSlot(slot) {
            this.activeSlot = Math.max(0, Math.min(SLOT_COUNT - 1, slot));
            this.renderFormForSlot(this.activeSlot);
            this.renderChips();
        }

        mount(stickers) {
            this.bindEvents();
            this.stickers = normalizeState(stickers);
            this.setActiveSlot(0);
            this.renderChips();
            this.renderSummary();
            this.emitChange();
        }

        destroy() {
            this.stickers = [];
            this.activeSlot = 0;
            this.renderChips();
            this.renderSummary();
        }

        getStickers() {
            return normalizeState(this.stickers);
        }

        getActiveSlot() {
            return this.activeSlot;
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
            this.renderChips();
            this.renderSummary();
            this.renderFormForSlot(values.slot);
            this.emitChange();
        }

        removeCurrentSlot() {
            const slot = this.getActiveSlot();
            this.stickers = this.stickers.filter((entry) => entry.slot !== slot);
            this.renderChips();
            this.renderSummary();
            this.renderFormForSlot(slot);
            this.emitChange();
        }

        resetAll() {
            this.stickers = [];
            this.renderChips();
            this.renderSummary();
            this.renderFormForSlot(this.getActiveSlot());
            this.emitChange();
        }

        renderChips() {
            const chips = this.container.querySelectorAll('[data-sticker-chip]');
            if (!chips || !chips.length) {
                return;
            }

            chips.forEach((chip) => {
                const slot = Number(chip.dataset.stickerChip || 0);
                const sticker = this.stickers.find((entry) => entry.slot === slot);
                chip.classList.toggle('is-active', slot === this.activeSlot);
                chip.classList.toggle('is-filled', Boolean(sticker));
                chip.innerHTML = sticker ? '&#10003;' : '+';
            });
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
