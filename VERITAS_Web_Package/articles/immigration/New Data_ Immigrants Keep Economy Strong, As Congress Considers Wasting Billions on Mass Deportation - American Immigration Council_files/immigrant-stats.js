(function() {
  console.log('[ImmigrantStats] loaded');

  // 1) Grab the localized endpoint URL
  const endpoint = window.ImmigrantStatsConfig?.endpoint
    || '/wp-json/immigratestats/v1/state-data';

  // 2) Cache DOM nodes
  const stateNameEl = document.getElementById('stateName');
  const statsEls = {
    immigrant_share_of_population: document.querySelector('[data-stat="immigrant_share_of_population"]'),
    immigrant_residents:           document.querySelector('[data-stat="immigrant_residents"]'),
    immigrant_taxes_paid:          document.querySelector('[data-stat="immigrant_taxes_paid"]'),
  };
  const select = document.getElementById('stateChoice');

  // 3) Core fetch + render logic
  function updateStats(state) {
    const url = state
      ? `${endpoint}?state=${encodeURIComponent(state)}`
      : endpoint;

    console.log('[ImmigrantStats] fetching', url);
    return fetch(url)
      .then(res => res.ok ? res.json() : Promise.reject(res.status))
      .then(data => {
        console.log('[ImmigrantStats] data', data);

        // Persist cookie for next page loads
        document.cookie = `state_data=${encodeURIComponent(data.state)};path=/;max-age=${365*24*60*60}`;

        // Render headline
        if (stateNameEl) {
          stateNameEl.textContent = data.state_json?.state_name || '—';
        }

        // Render each stat
        Object.entries(statsEls).forEach(([key, el]) => {
          if (el) el.textContent = data.state_json?.[key] || '—';
        });

        return data;
      })
      .catch(err => {
        console.error('[ImmigrantStats] fetch error', err);
      });
  }



// …


function loadInitial() {
  updateStats().then(data => {
    if ( data?.state === 'National' ) {
      console.log('[ImmigrantStats] falling back to client geo via our proxy');

      fetch('/wp-json/geo-proxy/v1/lookup')
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
        .then(info => {
          console.log('[ImmigrantStats] proxy geo info:', info);
          const region = info.regionName;
          // only override if it matches one of our states
          if ( select && Array.from(select.options).some(o => o.value === region) ) {
            updateStats(region);
            select.value = region;
          } else {
            console.log(`[ImmigrantStats] region "${region}" not in list, skipping fallback`);
          }
        })
        .catch(err => console.error('[ImmigrantStats] geo proxy error', err));
    }
  });
}




  // 5) Hook dropdown changes
  if (select) {
    select.addEventListener('change', function() {
      if ( this.value ) {
        updateStats(this.value);
      }
    });
  }

  // Kick it off
  loadInitial();
})();
