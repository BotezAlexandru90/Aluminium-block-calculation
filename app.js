        // Global variables representing default app structures
        let state = {
            processes: [
                { id: 1, name: "Rough Milling & Facing", time: 12.000 },
                { id: 2, name: "Finished Profiling", time: 10.000 },
                { id: 3, name: "Internal Flow Galleries (Deep-hole)", time: 15.000 },
                { id: 4, name: "Thread Tapping & Port Threading", time: 6.000 }
            ],
            specializedTools: [
                { id: 1, name: "SAE-8 Cavity Step Cutter", costPerPart: 4.500, qty: 2 },
                { id: 2, name: "Sun Hydraulics T-11A Tooling", costPerPart: 8.000, qty: 1 },
                { id: 3, name: "HydraForce VC08-2 Cavity Tool", costPerPart: 7.500, qty: 0 }
            ],
            postProcesses: [
                { id: 1, name: "Manual Deburring", type: "time", time: 15.000, rate: 45.000, flatCost: 0.000, weightCost: 0.000 },
                { id: 2, name: "Type II Anodizing (Clear)", type: "weight", time: 0.000, rate: 0.000, flatCost: 0.000, weightCost: 2.500 },
                { id: 3, name: "Ultrasonic Component Wash", type: "flat", time: 0.000, rate: 0.000, flatCost: 3.000, weightCost: 0.000 }
            ],
            nextProcessId: 5,
            nextToolId: 4,
            nextPostId: 4
        };

        window.onload = function() {
            // Load saved settings if they exist in local storage
            const loaded = localStorage.getItem('mfg_precision_cost_state');
            if (loaded) {
                try {
                    state = validateState(JSON.parse(loaded));
                    restoreDOMFromState();
                } catch(e) {
                    console.error("Failed to parse stored local state, using defaults.", e);
                }
            }
            renderProcesses();
            renderSpecializedTools();
            toggleNewPostFormFields();
            renderPostProcesses();
            calculate();
        };

        // DOM state syncing
        function restoreDOMFromState() {
            setVal('calc-mode-select', state.calcMode ?? 'dynamic');
            toggleCalcMode();
            setVal('mat-length', state.matLength ?? 150.000);
            setVal('mat-width', state.matWidth ?? 120.000);
            setVal('mat-height', state.matHeight ?? 80.000);
            setVal('mat-density', state.matDensity ?? 2.700);
            setVal('manual-raw-weight', state.manualRawWeight ?? 3.888);
            setVal('finished-weight', state.finishedWeight ?? 1.800);
            setVal('mat-cost-per-kg', state.matCostPerKg ?? 6.500);
            setVal('scrap-value-per-kg', state.scrapValuePerKg ?? 1.200);
            setVal('setup-programming-time', state.setupProgTime ?? 4.000);
            setVal('setup-machine-time', state.setupMachineTime ?? 2.000);
            setVal('setup-labor-rate', state.setupLaborRate ?? 65.000);
            setVal('setup-batch-size', state.setupBatchSize ?? 10);
            setVal('machine-hourly-rate', state.machineHourlyRate ?? 85.000);
            setVal('hole-qty', state.holeQty ?? 12);
            setVal('hole-time-sec', state.holeTimeSec ?? 25.000);
            setVal('wear-mode-select', state.wearMode ?? 'percentage');
            toggleWearMode();
            setVal('tool-wear-percent', state.toolWearPercent ?? 8.0);
            updateWearPercentText(state.toolWearPercent ?? 8.0);
            setVal('tool-wear-flat', state.toolWearFlat ?? 5.000);
        }

        function validateState(value) {
            const isRecord = item => item && typeof item === 'object' && !Array.isArray(item);
            const isNonNegativeNumber = number => Number.isFinite(number) && number >= 0;
            if (!isRecord(value) || !Array.isArray(value.processes) ||
                !Array.isArray(value.specializedTools) || !Array.isArray(value.postProcesses)) {
                throw new Error('Configuration must contain process, tool, and post-process lists.');
            }

            if (!value.processes.every(item => isRecord(item) && Number.isSafeInteger(item.id) &&
                typeof item.name === 'string' && isNonNegativeNumber(item.time)) ||
                !value.specializedTools.every(item => isRecord(item) && Number.isSafeInteger(item.id) &&
                typeof item.name === 'string' && isNonNegativeNumber(item.costPerPart) &&
                Number.isSafeInteger(item.qty) && item.qty >= 0) ||
                !value.postProcesses.every(item => isRecord(item) && Number.isSafeInteger(item.id) &&
                typeof item.name === 'string' && ['flat', 'weight', 'time'].includes(item.type) &&
                ['time', 'rate', 'flatCost', 'weightCost'].every(key => isNonNegativeNumber(item[key])))) {
                throw new Error('Configuration contains an invalid process, tool, or post-process.');
            }

            const numericSettings = [
                'matLength', 'matWidth', 'matHeight', 'matDensity', 'manualRawWeight',
                'finishedWeight', 'matCostPerKg', 'scrapValuePerKg', 'setupProgTime',
                'setupMachineTime', 'setupLaborRate', 'setupBatchSize', 'machineHourlyRate',
                'holeQty', 'holeTimeSec', 'toolWearPercent', 'toolWearFlat',
                'nextProcessId', 'nextToolId', 'nextPostId'
            ];
            if (numericSettings.some(key => value[key] !== undefined && !isNonNegativeNumber(value[key]))) {
                throw new Error('Configuration contains an invalid numeric setting.');
            }
            if (value.calcMode !== undefined && !['dynamic', 'manual'].includes(value.calcMode)) {
                throw new Error('Configuration contains an invalid material calculation mode.');
            }
            if (value.wearMode !== undefined && !['percentage', 'flat'].includes(value.wearMode)) {
                throw new Error('Configuration contains an invalid tooling mode.');
            }

            return { ...state, ...value };
        }

        function escapeHtml(value) {
            return String(value).replace(/[&<>"']/g, character => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            })[character]);
        }

        function setVal(id, val) {
            const el = document.getElementById(id);
            if (el) el.value = val;
        }

        function getVal(id) {
            const el = document.getElementById(id);
            return el ? el.value : '';
        }

        function serializeState() {
            // Read UI parameters and bind back into global state object for export/saving
            return {
                processes: state.processes,
                specializedTools: state.specializedTools,
                postProcesses: state.postProcesses,
                nextProcessId: state.nextProcessId,
                nextToolId: state.nextToolId,
                nextPostId: state.nextPostId,
                calcMode: getVal('calc-mode-select'),
                matLength: parseFloat(getVal('mat-length')) || 0,
                matWidth: parseFloat(getVal('mat-width')) || 0,
                matHeight: parseFloat(getVal('mat-height')) || 0,
                matDensity: parseFloat(getVal('mat-density')) || 0,
                manualRawWeight: parseFloat(getVal('manual-raw-weight')) || 0,
                finishedWeight: parseFloat(getVal('finished-weight')) || 0,
                matCostPerKg: parseFloat(getVal('mat-cost-per-kg')) || 0,
                scrapValuePerKg: parseFloat(getVal('scrap-value-per-kg')) || 0,
                setupProgTime: parseFloat(getVal('setup-programming-time')) || 0,
                setupMachineTime: parseFloat(getVal('setup-machine-time')) || 0,
                setupLaborRate: parseFloat(getVal('setup-labor-rate')) || 0,
                setupBatchSize: parseInt(getVal('setup-batch-size')) || 1,
                machineHourlyRate: parseFloat(getVal('machine-hourly-rate')) || 0,
                holeQty: parseInt(getVal('hole-qty')) || 0,
                holeTimeSec: parseFloat(getVal('hole-time-sec')) || 0,
                wearMode: getVal('wear-mode-select'),
                toolWearPercent: parseFloat(getVal('tool-wear-percent')) || 0,
                toolWearFlat: parseFloat(getVal('tool-wear-flat')) || 0
            };
        }

        // Onboarding / Guide controls
        function openGuide() {
            document.getElementById('guide-modal').classList.remove('hidden');
        }

        function closeGuide() {
            document.getElementById('guide-modal').classList.add('hidden');
        }

        // Save & Export / Import triggers
        function showToast(message) {
            const toast = document.getElementById('toast');
            toast.innerText = message;
            toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
            setTimeout(() => {
                toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
            }, 3000);
        }

        function saveToLocal() {
            const currentState = serializeState();
            localStorage.setItem('mfg_precision_cost_state', JSON.stringify(currentState));
            showToast('Setup saved to browser memory.');
        }

        function exportJSON() {
            const currentState = serializeState();
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentState, null, 2));
            const dlAnchorElem = document.createElement('a');
            dlAnchorElem.setAttribute("href", dataStr);
            dlAnchorElem.setAttribute("download", "mfg_cost_estimation_setup.json");
            dlAnchorElem.click();
            showToast('JSON config exported.');
        }

        function importJSON(event) {
            const input = event.target;
            const reader = new FileReader();
            reader.onload = function() {
                try {
                    state = validateState(JSON.parse(reader.result));
                    restoreDOMFromState();
                    renderProcesses();
                    renderSpecializedTools();
                    renderPostProcesses();
                    calculate();
                    showToast('Configuration successfully imported.');
                } catch (e) {
                    alert('Invalid JSON structure. Please check the imported template file.');
                } finally {
                    input.value = '';
                }
            };
            if(input.files[0]) {
                reader.readAsText(input.files[0]);
            }
        }

        // Dynamic Processes DOM manipulation
        function renderProcesses() {
            const container = document.getElementById('processes-container');
            container.innerHTML = '';
            
            state.processes.forEach((proc) => {
                const row = document.createElement('div');
                row.className = 'grid grid-cols-12 gap-2 items-center';
                row.innerHTML = `
                    <div class="col-span-8">
                        <input type="text" value="${escapeHtml(proc.name)}" onchange="updateProcessName(${proc.id}, this.value)" class="w-full bg-slate-900/80 border border-slate-700/50 rounded px-2.5 py-1 text-xs text-slate-200 focus:border-blue-500 focus:outline-none">
                    </div>
                    <div class="col-span-3">
                        <input type="number" step="0.001" value="${proc.time.toFixed(3)}" min="0" oninput="updateProcessTime(${proc.id}, this.value); calculate()" class="w-full bg-slate-900/80 border border-slate-700/50 rounded px-2.5 py-1 text-xs text-slate-200 text-right focus:border-blue-500 focus:outline-none">
                    </div>
                    <div class="col-span-1 text-right">
                        <button type="button" onclick="removeProcess(${proc.id})" class="text-slate-500 hover:text-red-400 transition text-sm">&times;</button>
                    </div>
                `;
                container.appendChild(row);
            });
        }

        function updateProcessName(id, value) {
            const proc = state.processes.find(p => p.id === id);
            if (proc) proc.name = value;
        }

        function updateProcessTime(id, value) {
            const proc = state.processes.find(p => p.id === id);
            if (proc) proc.time = parseFloat(value) || 0;
        }

        function removeProcess(id) {
            state.processes = state.processes.filter(p => p.id !== id);
            renderProcesses();
            calculate();
        }

        function addCustomProcess() {
            const nameInput = document.getElementById('new-proc-name');
            const timeInput = document.getElementById('new-proc-time');
            
            const name = nameInput.value.trim() || "Custom Step";
            const time = parseFloat(timeInput.value) || 0;

            state.processes.push({
                id: state.nextProcessId++,
                name: name,
                time: time
            });

            nameInput.value = '';
            timeInput.value = '';
            renderProcesses();
            calculate();
        }

        // Dynamic Post-Machining processes DOM manipulation
        function renderPostProcesses() {
            const container = document.getElementById('post-processes-container');
            container.innerHTML = '';

            state.postProcesses.forEach((post) => {
                const row = document.createElement('div');
                row.className = 'grid grid-cols-12 gap-2 items-center';
                
                let detailsHTML = '';
                if (post.type === 'flat') {
                    detailsHTML = `
                        <div class="col-span-4 text-right">
                            <input type="number" step="0.001" value="${post.flatCost.toFixed(3)}" min="0" oninput="updatePostMetric(${post.id}, 'flatCost', this.value); calculate()" class="w-24 bg-slate-900/80 border border-slate-700/50 rounded px-2.5 py-1 text-xs text-slate-200 text-right focus:border-blue-500 focus:outline-none inline"> <span class="text-[10px] text-slate-400">€/part</span>
                        </div>`;
                } else if (post.type === 'weight') {
                    detailsHTML = `
                        <div class="col-span-4 text-right">
                            <input type="number" step="0.001" value="${post.weightCost.toFixed(3)}" min="0" oninput="updatePostMetric(${post.id}, 'weightCost', this.value); calculate()" class="w-24 bg-slate-900/80 border border-slate-700/50 rounded px-2.5 py-1 text-xs text-slate-200 text-right focus:border-blue-500 focus:outline-none inline"> <span class="text-[10px] text-slate-400">€/kg</span>
                        </div>`;
                } else if (post.type === 'time') {
                    detailsHTML = `
                        <div class="col-span-4 grid grid-cols-2 gap-1">
                            <div>
                                <input type="number" step="0.001" value="${post.time.toFixed(3)}" min="0" oninput="updatePostMetric(${post.id}, 'time', this.value); calculate()" class="w-full bg-slate-900/80 border border-slate-700/50 rounded px-2 py-1 text-xs text-slate-200 text-right focus:border-blue-500 focus:outline-none" placeholder="Mins">
                                <span class="text-[8px] text-slate-500 block text-right">mins</span>
                            </div>
                            <div>
                                <input type="number" step="0.001" value="${post.rate.toFixed(3)}" min="0" oninput="updatePostMetric(${post.id}, 'rate', this.value); calculate()" class="w-full bg-slate-900/80 border border-slate-700/50 rounded px-2 py-1 text-xs text-slate-200 text-right focus:border-blue-500 focus:outline-none" placeholder="€/hr">
                                <span class="text-[8px] text-slate-500 block text-right">€/hr</span>
                            </div>
                        </div>`;
                }

                row.innerHTML = `
                    <div class="col-span-4">
                        <input type="text" value="${escapeHtml(post.name)}" onchange="updatePostName(${post.id}, this.value)" class="w-full bg-slate-900/80 border border-slate-700/50 rounded px-2.5 py-1 text-xs text-slate-200 focus:border-blue-500 focus:outline-none">
                    </div>
                    <div class="col-span-3 text-xs text-slate-400 capitalize px-1">
                        ${post.type === 'time' ? 'Time-based' : post.type === 'weight' ? 'Weight-based' : 'Flat-rate'}
                    </div>
                    ${detailsHTML}
                    <div class="col-span-1 text-right">
                        <button type="button" onclick="removePostProcess(${post.id})" class="text-slate-500 hover:text-red-400 transition text-sm">&times;</button>
                    </div>
                `;
                container.appendChild(row);
            });
        }

        function updatePostName(id, val) {
            const post = state.postProcesses.find(p => p.id === id);
            if (post) post.name = val;
        }

        function updatePostMetric(id, key, val) {
            const post = state.postProcesses.find(p => p.id === id);
            if (post) post[key] = parseFloat(val) || 0;
        }

        function removePostProcess(id) {
            state.postProcesses = state.postProcesses.filter(p => p.id !== id);
            renderPostProcesses();
            calculate();
        }

        function toggleNewPostFormFields() {
            const type = document.getElementById('new-post-type').value;
            const container = document.getElementById('new-post-metrics');
            container.innerHTML = '';

            if (type === 'flat') {
                container.innerHTML = `
                    <div class="col-span-2">
                        <label class="block text-[10px] text-slate-500 mb-0.5">Flat Cost per Part (€)</label>
                        <input type="number" id="new-post-flat" step="0.001" min="0" value="5.000" class="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none">
                    </div>
                `;
            } else if (type === 'weight') {
                container.innerHTML = `
                    <div class="col-span-2">
                        <label class="block text-[10px] text-slate-500 mb-0.5">Price per Finished kg (€/kg)</label>
                        <input type="number" id="new-post-weight" step="0.001" min="0" value="3.500" class="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none">
                    </div>
                `;
            } else if (type === 'time') {
                container.innerHTML = `
                    <div>
                        <label class="block text-[10px] text-slate-500 mb-0.5">Time per Part (mins)</label>
                        <input type="number" id="new-post-time-val" step="0.001" min="0" value="10.000" class="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-[10px] text-slate-500 mb-0.5">Labor Hourly Rate (€/hr)</label>
                        <input type="number" id="new-post-rate-val" step="0.001" min="0" value="45.000" class="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none">
                    </div>
                `;
            }
        }

        function addCustomPostProcess() {
            const nameInput = document.getElementById('new-post-name');
            const type = document.getElementById('new-post-type').value;

            const name = nameInput.value.trim() || "Dynamic Finishing Step";
            let flatCost = 0.000, weightCost = 0.000, time = 0.000, rate = 0.000;

            if (type === 'flat') {
                flatCost = parseFloat(document.getElementById('new-post-flat').value) || 0;
            } else if (type === 'weight') {
                weightCost = parseFloat(document.getElementById('new-post-weight').value) || 0;
            } else if (type === 'time') {
                time = parseFloat(document.getElementById('new-post-time-val').value) || 0;
                rate = parseFloat(document.getElementById('new-post-rate-val').value) || 0;
            }

            state.postProcesses.push({
                id: state.nextPostId++,
                name: name,
                type: type,
                time: time,
                rate: rate,
                flatCost: flatCost,
                weightCost: weightCost
            });

            nameInput.value = '';
            renderPostProcesses();
            calculate();
        }

        // Specialized Tools manipulation
        function renderSpecializedTools() {
            const container = document.getElementById('specialized-tools-container');
            container.innerHTML = '';

            state.specializedTools.forEach((tool) => {
                const div = document.createElement('div');
                div.className = 'flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900/40 p-2.5 rounded border border-slate-700/50 gap-2';
                div.innerHTML = `
                    <div class="flex-grow">
                        <div class="text-xs font-semibold text-slate-200">${escapeHtml(tool.name)}</div>
                        <div class="text-[10px] text-slate-500">Amortized tool degradation: €${tool.costPerPart.toFixed(3)} / cycle</div>
                    </div>
                    <div class="flex items-center gap-2 self-stretch sm:self-auto justify-between">
                        <span class="text-xs text-slate-400">Qty Needed:</span>
                        <div class="flex items-center gap-1">
                            <button type="button" onclick="updateToolQty(${tool.id}, -1)" class="w-6 h-6 bg-slate-800 text-white border border-slate-700 rounded hover:bg-slate-700 text-xs">-</button>
                            <span class="w-8 text-center text-xs font-mono font-bold text-white">${tool.qty}</span>
                            <button type="button" onclick="updateToolQty(${tool.id}, 1)" class="w-6 h-6 bg-slate-800 text-white border border-slate-700 rounded hover:bg-slate-700 text-xs">+</button>
                        </div>
                        <button type="button" onclick="removeTool(${tool.id})" class="text-slate-500 hover:text-red-400 transition text-xs ml-2">&times;</button>
                    </div>
                `;
                container.appendChild(div);
            });
        }

        function updateToolQty(id, change) {
            const tool = state.specializedTools.find(t => t.id === id);
            if (tool) {
                tool.qty = Math.max(0, tool.qty + change);
            }
            renderSpecializedTools();
            calculate();
        }

        function removeTool(id) {
            state.specializedTools = state.specializedTools.filter(t => t.id !== id);
            renderSpecializedTools();
            calculate();
        }

        function addCustomTool() {
            const nameInput = document.getElementById('new-tool-name');
            const costInput = document.getElementById('new-tool-cost');

            const name = nameInput.value.trim() || "Precision Boring Profile";
            const cost = parseFloat(costInput.value) || 0.000;

            state.specializedTools.push({
                id: state.nextToolId++,
                name: name,
                costPerPart: cost,
                qty: 1
            });

            nameInput.value = '';
            costInput.value = '';
            renderSpecializedTools();
            calculate();
        }

        // Dimension calculation style transitions
        function toggleCalcMode() {
            const mode = document.getElementById('calc-mode-select').value;
            if (mode === 'dynamic') {
                document.getElementById('dynamic-material-inputs').classList.remove('hidden');
                document.getElementById('manual-material-inputs').classList.add('hidden');
            } else {
                document.getElementById('dynamic-material-inputs').classList.add('hidden');
                document.getElementById('manual-material-inputs').classList.remove('hidden');
            }
            calculate();
        }

        function toggleWearMode() {
            const mode = document.getElementById('wear-mode-select').value;
            if (mode === 'percentage') {
                document.getElementById('wear-percentage-container').classList.remove('hidden');
                document.getElementById('wear-flat-container').classList.add('hidden');
            } else {
                document.getElementById('wear-percentage-container').classList.add('hidden');
                document.getElementById('wear-flat-container').classList.remove('hidden');
            }
            calculate();
        }

        function updateWearPercentText(val) {
            document.getElementById('wear-percent-display').innerText = parseFloat(val).toFixed(3) + '%';
        }

        // Calculation Engine
        function calculate() {
            // 1. RAW MATERIAL NET COST
            const calcMode = document.getElementById('calc-mode-select').value;
            let rawWeight = 0;

            if (calcMode === 'dynamic') {
                const len = parseFloat(document.getElementById('mat-length').value) || 0;
                const wid = parseFloat(document.getElementById('mat-width').value) || 0;
                const hgt = parseFloat(document.getElementById('mat-height').value) || 0;
                const density = parseFloat(document.getElementById('mat-density').value) || 0;
                
                // Volume in cm^3 (mm3 converted by dividing by 1000)
                const volCm3 = (len * wid * hgt) / 1000;
                // Weight in kg (volCm3 * density / 1000)
                rawWeight = (volCm3 * density) / 1000;
            } else {
                rawWeight = parseFloat(document.getElementById('manual-raw-weight').value) || 0;
            }

            const finishedWeight = parseFloat(document.getElementById('finished-weight').value) || 0;
            const matCostPerKg = parseFloat(document.getElementById('mat-cost-per-kg').value) || 0;
            const scrapValuePerKg = parseFloat(document.getElementById('scrap-value-per-kg').value) || 0;

            const scrapWeight = Math.max(0, rawWeight - finishedWeight);
            const totalRawCost = rawWeight * matCostPerKg;
            const scrapCredit = scrapWeight * scrapValuePerKg;
            const netMaterialCost = Math.max(0, totalRawCost - scrapCredit);

            // 2. SETUP & PROGRAMMING AMORTIZATION
            const progTime = parseFloat(document.getElementById('setup-programming-time').value) || 0;
            const machineSetupTime = parseFloat(document.getElementById('setup-machine-time').value) || 0;
            const setupLaborRate = parseFloat(document.getElementById('setup-labor-rate').value) || 0;
            const batchSize = Math.max(1, parseInt(document.getElementById('setup-batch-size').value) || 1);

            const totalSetupLabor = (progTime + machineSetupTime) * setupLaborRate;
            const setupCostPerPart = totalSetupLabor / batchSize;

            // 3. MACHINING PROCESS TIME & CYCLE RUN
            let processesTimeMins = 0;
            state.processes.forEach(p => processesTimeMins += p.time);

            const holesQty = parseInt(document.getElementById('hole-qty').value) || 0;
            const holeTimeSecs = parseFloat(document.getElementById('hole-time-sec').value) || 0;
            const holesTimeMins = (holesQty * holeTimeSecs) / 60;

            const totalCycleTimeMins = processesTimeMins + holesTimeMins;
            const machineHourlyRate = parseFloat(document.getElementById('machine-hourly-rate').value) || 0;
            const machiningCostPerPart = (totalCycleTimeMins / 60) * machineHourlyRate;

            // 4. TOOLING CONSUMABLES
            const wearMode = document.getElementById('wear-mode-select').value;
            let standardToolingCost = 0;
            if (wearMode === 'percentage') {
                const percent = parseFloat(document.getElementById('tool-wear-percent').value) || 0;
                standardToolingCost = machiningCostPerPart * (percent / 100);
            } else {
                standardToolingCost = parseFloat(document.getElementById('tool-wear-flat').value) || 0;
            }

            let specializedToolsCost = 0;
            state.specializedTools.forEach(t => specializedToolsCost += (t.costPerPart * t.qty));
            const totalToolingCost = standardToolingCost + specializedToolsCost;

            // 5. POST-MACHINING OPERATIONS DYNAMIC SUMMATION
            let totalPostCost = 0;
            state.postProcesses.forEach((post) => {
                if (post.type === 'flat') {
                    totalPostCost += post.flatCost;
                } else if (post.type === 'weight') {
                    totalPostCost += (finishedWeight * post.weightCost);
                } else if (post.type === 'time') {
                    totalPostCost += ((post.time / 60) * post.rate);
                }
            });

            // GRAND TOTAL CALCULATIONS
            const totalUnitCost = netMaterialCost + setupCostPerPart + machiningCostPerPart + totalToolingCost + totalPostCost;
            const batchCostTotal = totalUnitCost * batchSize;

            // DOM UPDATES
            document.getElementById('total-part-cost').innerText = `€${totalUnitCost.toFixed(3)}`;
            document.getElementById('batch-cost-statement').innerText = `Total batch run cost: €${batchCostTotal.toFixed(3)} (${batchSize} parts)`;

            // Sidebar breakdown details
            document.getElementById('out-mat-cost').innerText = `€${netMaterialCost.toFixed(3)}`;
            document.getElementById('out-mat-weight-details').innerText = `Raw Weight: ${rawWeight.toFixed(3)} kg (${finishedWeight.toFixed(3)} kg net)`;
            document.getElementById('out-scrap-recovery-details').innerText = `Scrap recovery credit: -€${scrapCredit.toFixed(3)}`;

            document.getElementById('out-setup-cost').innerText = `€${setupCostPerPart.toFixed(3)}`;
            document.getElementById('out-setup-time-details').innerText = `Setup block: ${(progTime + machineSetupTime).toFixed(3)} hrs total`;

            document.getElementById('out-machining-cost').innerText = `€${machiningCostPerPart.toFixed(3)}`;
            document.getElementById('out-machining-time-details').innerText = `Total Cycle Time: ${totalCycleTimeMins.toFixed(3)} mins`;
            document.getElementById('out-machining-rate-details').innerText = `Machine Rate: €${machineHourlyRate.toFixed(3)}/hr`;

            document.getElementById('out-tooling-cost').innerText = `€${totalToolingCost.toFixed(3)}`;
            document.getElementById('out-tooling-details').innerText = `Std Wear: €${standardToolingCost.toFixed(3)} | Cavity: €${specializedToolsCost.toFixed(3)}`;

            document.getElementById('out-post-cost').innerText = `€${totalPostCost.toFixed(3)}`;

            // Metadata block updates
            document.getElementById('meta-raw-mass').innerText = `${rawWeight.toFixed(3)} kg`;
            document.getElementById('meta-fin-mass').innerText = `${finishedWeight.toFixed(3)} kg`;
            const lossPercent = rawWeight > 0 ? (Math.max(0, rawWeight - finishedWeight) / rawWeight) * 100 : 0;
            document.getElementById('meta-loss-percent').innerText = `${lossPercent.toFixed(3)}%`;
            document.getElementById('meta-run-time').innerText = `${totalCycleTimeMins.toFixed(3)} mins`;

            // Adjust allocation bars dynamically
            if (totalUnitCost > 0) {
                document.getElementById('bar-material').style.width = `${(netMaterialCost / totalUnitCost) * 100}%`;
                document.getElementById('bar-setup').style.width = `${(setupCostPerPart / totalUnitCost) * 100}%`;
                document.getElementById('bar-machining').style.width = `${(machiningCostPerPart / totalUnitCost) * 100}%`;
                document.getElementById('bar-tooling').style.width = `${(totalToolingCost / totalUnitCost) * 100}%`;
                document.getElementById('bar-post').style.width = `${(totalPostCost / totalUnitCost) * 100}%`;
            } else {
                document.getElementById('bar-material').style.width = '0%';
                document.getElementById('bar-setup').style.width = '0%';
                document.getElementById('bar-machining').style.width = '0%';
                document.getElementById('bar-tooling').style.width = '0%';
                document.getElementById('bar-post').style.width = '0%';
            }
        }
