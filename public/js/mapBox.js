/*eslint-disable*/

const displayMap = (locations, token) => {
  // sets the access token, associating the map with your Mapbox account and its permissions
  mapboxgl.accessToken = token

  // creates the map, setting the container to the id of the div you added in step 2, and setting the initial center and zoom level of the map
  const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/majid-rs/cmocpts7s002c01shdnjk3qt3',
    scrollZoom: false
  })

  const bounds = new mapboxgl.LngLatBounds()

  locations.forEach((loc) => {
    const el = document.createElement('div')
    el.className = 'marker'
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .addTo(map)
    new mapboxgl.Popup({
      offset: 35
    })
      .setHTML(`<p> Day ${loc.day}: ${loc.description}</p>`)
      .setLngLat(loc.coordinates)
      .addTo(map)
    bounds.extend(loc.coordinates)
  })

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 200,
      left: 100,
      right: 100
    }
  })
}

export default displayMap
