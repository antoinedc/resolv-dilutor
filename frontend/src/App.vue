<template>
  <div class="min-h-screen bg-gray-100 overflow-auto fixed inset-0">
    <div class="min-h-full py-6 flex flex-col items-center space-y-6">
      <div class="w-full max-w-xl px-4">
        <div class="relative px-4 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div class="max-w-md mx-auto">
            <div class="divide-y divide-gray-200">
              <div class="text-base leading-6 space-y- text-gray-700 sm:text-lg sm:leading-7">
                <h1 class="text-2xl font-bold mb-8 text-center text-indigo-600">Resolv Points Dilution Calculator</h1>
                
                <div class="mb-8">
                  <h2 class="text-lg font-semibold mb-2">Minimum Points Needed</h2>
                  <p class="text-gray-600">
                    You need to earn at least <span class="font-bold text-indigo-600">{{ minPointsNeeded.toLocaleString() }}</span> points per day to avoid dilution
                  </p>
                </div>

                <div class="mb-8">
                  <h2 class="text-lg font-semibold mb-2">Points Stats</h2>
                  <div v-if="pointsStats" class="space-y-2">
                    <p class="text-gray-600">
                      Today's total points: <span class="font-bold text-indigo-600">{{ pointsStats.today.toLocaleString() }}</span>
                    </p>
                    <p class="text-gray-600">
                      Yesterday's total points: <span class="font-bold text-indigo-600">{{ pointsStats.yesterday.toLocaleString() }}</span>
                    </p>
                    <p class="text-gray-600">
                      Change: 
                      <span :class="{'text-green-600': pointsStats.change >= 0, 'text-red-600': pointsStats.change < 0}" class="font-bold">
                        {{ pointsStats.change >= 0 ? '+' : '' }}{{ pointsStats.change.toLocaleString() }} points
                        ({{ pointsStats.changePercentage >= 0 ? '+' : '' }}{{ pointsStats.changePercentage.toFixed(2) }}%)
                      </span>
                    </p>
                  </div>
                  <div v-else class="text-gray-500">
                    Loading points statistics...
                  </div>
                </div>

                <div class="mb-8">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Ethereum Address
                  </label>
                  <input
                    v-model="address"
                    type="text"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                    placeholder="0x..."
                    :disabled="loading"
                    autocomplete="on"
                    name="ethereum-address"
                  />
                  <button
                    @click="calculateDilution"
                    class="mt-4 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                    :disabled="loading || !isValidAddress"
                  >
                    {{ loading ? 'Calculating...' : 'Calculate Dilution' }}
                  </button>
                </div>

                <div v-if="error" class="text-red-600 mt-4">
                  {{ error }}
                </div>

                <div v-if="result" class="mt-8 p-4 bg-gray-50 rounded-lg text-center">
                  <h3 class="text-lg font-semibold mb-4">Results:</h3>
                  <div class="space-y-4">
                    <div>
                      <h4 class="text-sm font-medium text-gray-500 mb-1 flex items-center justify-center">
                        Dilution Rate
                        <div class="relative inline-block">
                          <svg @mouseenter="showTooltip = true" @mouseleave="showTooltip = false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 ml-1 text-gray-400 cursor-help">
                            <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" />
                          </svg>
                          <div v-if="showTooltip" class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm w-64 text-center z-10">
                            Calculation compares your current daily points against the change in total points between yesterday and today (all numbers are fetched from the Resolv API).
                            <div class="tooltip-arrow absolute top-full left-1/2 transform -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </h4>
                      <p class="text-lg">
                        <span :class="{'text-red-600': result.dilutionPercentage > 0, 'text-green-600': result.dilutionPercentage <= 0}" class="font-bold">
                          {{ result.dilutionPercentage > 0 ? '+' : '' }}{{ result.dilutionPercentage }}%
                        </span>
                        <span class="text-sm text-gray-500 ml-1">
                          (share of points {{ result.dilutionPercentage <= 0 ? 'increasing' : 'decreasing' }})
                        </span>
                      </p>
                    </div>
                    <div>
                      <h4 class="text-sm font-medium text-gray-500 mb-1">Total Points Earned</h4>
                      <p class="text-lg">
                        <span class="font-bold text-indigo-600">{{ result.totalPoints.toLocaleString() }}</span>
                        <span class="text-sm text-gray-500 ml-1">
                          ({{ ((result.totalPoints / pointsStats.today) * 100).toFixed(4) }}% of grand total)
                        </span>
                      </p>
                    </div>
                    <div>
                      <h4 class="text-sm font-medium text-gray-500 mb-1">Daily Points</h4>
                      <p class="text-lg">
                        <span class="font-bold text-indigo-600">{{ result.currentPoints.toLocaleString() }}</span>
                        <span class="text-sm text-gray-500 ml-1">points/day ({{ ((result.currentPoints / pointsStats.change) * 100).toFixed(4) }}% of daily change)</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="w-full max-w-xl px-4">
        <div class="relative px-4 py-6 bg-white shadow-lg sm:rounded-3xl sm:p-8">
          <div class="max-w-md mx-auto">
            <div class="space-y-4 text-center">
              <div>
                <h3 class="text-lg font-semibold text-gray-700 mb-2">Support the Project</h3>
                <div class="space-y-2">
                  <p class="text-sm text-gray-600">
                    Referral link:
                    <a href="https://app.resolv.xyz/ref/antoine" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-800 font-medium">
                      app.resolv.xyz/ref/antoine
                    </a>
                  </p>
                  <p class="text-sm text-gray-600">
                    Donate:
                    <span class="font-mono text-indigo-600 break-all">0x569AAC8a49f0482D6cdC41c0d2C289935fC72253</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="w-full max-w-xl px-4">
        <div class="text-center">
          <p class="text-sm text-gray-600">
            Built by the team behind <a href="https://tryethernal.com?ref=resolv-dilutor" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-800 font-medium">Ethernal</a> | Code available on <a href="https://github.com/antoinedc/resolv-dilutor" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-800 font-medium">Github</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import './style.css'

const API_URL = import.meta.env.VITE_API_URL
const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!API_URL || !API_KEY) {
  console.error('Missing required environment variables')
}

console.log('API Configuration:', {
  hasUrl: !!API_URL,
  hasKey: !!API_KEY
})

const address = ref('')
const loading = ref(false)
const error = ref('')
const result = ref<any>(null)
const minPointsNeeded = ref<number>(0)
const pointsStats = ref<any>(null)
const showTooltip = ref(false)

const isValidAddress = computed(() => {
  return /^0x[a-fA-F0-9]{40}$/.test(address.value)
})

async function calculateDilution() {
  if (!isValidAddress.value) {
    error.value = 'Please enter a valid Ethereum address'
    return
  }

  loading.value = true
  error.value = ''
  result.value = null

  try {
    const url = `${API_URL}/dilution?address=${address.value}`
    console.log('Fetching dilution:', { url })
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'apikey': API_KEY
      }
    })
    console.log('Response status:', response.status)
    const data = await response.json()
    console.log('Response data:', data)

    if (!response.ok) {
      throw new Error(data.error || 'Failed to calculate dilution')
    }

    result.value = data
  } catch (e: any) {
    console.error('Dilution error:', e)
    error.value = e.message || 'An error occurred while calculating dilution'
  } finally {
    loading.value = false
  }
}

async function fetchMinimumPoints() {
  console.log('API Configuration:', { url: API_URL, hasKey: !!API_KEY });
  const url = `${API_URL}/min-points`;
  console.log('Fetching minimum points:', { url });
  
  try {
    const response = await fetch(url, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch minimum points');
    }
    
    minPointsNeeded.value = data.minPointsNeeded;
  } catch (error) {
    console.error('Minimum points error:', error);
    throw error;
  }
}

async function fetchPointsStats() {
  console.log('API Configuration:', { url: API_URL, hasKey: !!API_KEY });
  const url = `${API_URL}/points-stats`;
  console.log('Fetching points statistics:', { url });
  
  try {
    const response = await fetch(url, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch points statistics');
    }
    
    pointsStats.value = data;
  } catch (error) {
    console.error('Points statistics error:', error);
    throw error;
  }
}

onMounted(() => {
  fetchMinimumPoints()
  fetchPointsStats()
})
</script>
