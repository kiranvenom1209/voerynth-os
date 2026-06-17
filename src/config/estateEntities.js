export const estateEntities = {
  dashboard: {
    owner: {
      name: 'Kiran',
      person: 'person.kiran',
    },
    sensors: {
      personDetection: 'binary_sensor.tc71_person_detection',
      fan: 'fan.air_circulator',
    },
    voice: {
      assistSwitch: 'input_boolean.assist_switch',
      intelligentMode: 'input_boolean.ammu_intelligent',
      satellite: 'assist_satellite.home_assistant_voice_09af65_assist_satellite',
    },
    quickModes: [
      { id: 'input_boolean.movie_mode', label: 'Movie', icon: 'video', color: 'purple' },
      { id: 'input_boolean.jazz_mode', label: 'Jazz', icon: 'music', color: 'blue' },
      { id: 'input_boolean.mode_relax', label: 'Relax', icon: 'coffee', color: 'emerald' },
      { id: 'input_boolean.pooja', label: 'Aarti', icon: 'sparkles', color: 'amber' },
    ],
  },
  weather: {
    title: 'Schmalkalden Climate',
    subtitle: 'Local Conditions',
    temperature: 'sensor.forecast_current_temperature',
    humidity: 'sensor.forecast_current_humidity',
    airQuality: 'sensor.air_quality_index',
    sun: 'sun.sun',
    windSpeed: 'sensor.forecast_current_wind_speed',
    windBearing: 'sensor.forecast_current_wind_bearing',
  },
  transit: {
    title: 'Transit Uplink',
    subtitle: 'FH-S Station',
    departures: 'sensor.schmalkalden_fachhochschule_departures_2',
  },
  residents: {
    primaryPerson: 'person.kiran',
    people: [
      { name: 'Kiran', entity: 'person.kiran', phone: 'sensor.kiran_s_phone_battery_level' },
      { name: 'Danny', entity: 'person.danny', phone: 'sensor.danny_s_phone_battery_level' },
    ],
    homeProxy: { name: 'Home', entity: 'person.ayanthiara', phone: 'sensor.xiaomi_pad_5_battery' },
  },
  liveLocation: {
    routePerson: 'person.kiran',
    people: [
      { id: 'kiran', name: 'Kiran', entity: 'person.kiran' },
      { id: 'danny', name: 'Danny', entity: 'person.danny' },
    ],
    homeProxy: { id: 'ayanthiara', name: 'Home', entity: 'person.ayanthiara' },
  },
  fan: {
    name: 'Dreo Air Circulator',
    fan: 'fan.air_circulator',
    light: 'light.air_circulator_rgb_light',
    temperature: 'sensor.air_circulator_temperature',
    oscillation: 'switch.air_circulator_horizontally_oscillating',
    oscillationDirection: 'select.air_circulator_oscillation_direction',
    angleHorizontal: 'number.air_circulator_fan_angle_horizontal',
    angleVertical: 'number.air_circulator_fan_angle_vertical',
  },
  lights: {
    rooms: [
      {
        name: 'Living Room',
        icon: 'armchair',
        lights: [
          { id: 'light.ceiling_light_living_room', name: 'Ceiling', icon: 'circleDot', brandIcon: 'CeilingRound', mobileOrderClass: 'order-2 md:order-none' },
          { id: 'light.left_light', name: 'TV Left', icon: 'gem', brandIcon: 'Iris', mobileOrderClass: 'order-3 md:order-none' },
          { id: 'light.living_room_2', name: 'Living Area', icon: 'sofa', mobileOrderClass: 'order-1 md:order-none' },
          { id: 'light.right_light', name: 'TV Right', icon: 'gem', brandIcon: 'Iris', mobileOrderClass: 'order-4 md:order-none' },
        ],
        scenes: [
          { id: 'scene.living_room_read', label: 'Warm', icon: 'sunrise', gradient: 'warm' },
          { id: 'scene.living_room_tokyo', label: 'Tokyo', icon: 'building2', gradient: 'tokyo' },
          { id: 'scene.living_room_jazz', label: 'Fireplace', icon: 'flame', gradient: 'fireplace' },
        ],
      },
      {
        name: 'Dining Area',
        icon: 'utensils',
        lights: [
          { id: 'light.dinning_light_1', name: 'Bulb 1', icon: 'lightbulb', brandIcon: 'bulbsClassic', mobileOrderClass: 'order-2 md:order-none' },
          { id: 'light.dinning_light_2', name: 'Bulb 2', icon: 'lightbulb', brandIcon: 'bulbsClassic', mobileOrderClass: 'order-3 md:order-none' },
          { id: 'light.dining', name: 'Chandelier', icon: 'sparkles', brandIcon: 'chandelier', mobileOrderClass: 'order-1 md:order-none' },
          { id: 'light.dinning_light_3', name: 'Bulb 3', icon: 'lightbulb', brandIcon: 'bulbsClassic', mobileOrderClass: 'order-4 md:order-none' },
        ],
        scenes: [
          { id: 'scene.dining_read', label: 'Warm', icon: 'sunrise', gradient: 'warm' },
          { id: 'scene.dining_tokyo', label: 'Tokyo', icon: 'building2', gradient: 'tokyo' },
          { id: 'scene.dining_jazz_drinking', label: 'Jazz', icon: 'music', gradient: 'jazz' },
        ],
      },
      {
        name: 'Kitchen',
        icon: 'chefHat',
        lights: [
          { id: 'light.kitchen_light_1', name: 'Spot 1', icon: 'cone', brandIcon: 'bulbsSpot', mobileOrderClass: 'order-2 md:order-none' },
          { id: 'light.kitchen_light_2', name: 'Spot 2', icon: 'cone', brandIcon: 'bulbsSpot', mobileOrderClass: 'order-3 md:order-none' },
          { id: 'light.kitchen', name: 'Main Spots', icon: 'chefHat', mobileOrderClass: 'order-1 md:order-none' },
          { id: 'light.kitchen_light_3', name: 'Spot 3', icon: 'cone', brandIcon: 'bulbsSpot', mobileOrderClass: 'order-4 md:order-none' },
        ],
        scenes: [
          { id: 'scene.kitchen_read', label: 'Warm', icon: 'sunrise', gradient: 'warm' },
          { id: 'scene.kitchen_concentrate', label: 'Cool', icon: 'wind', gradient: 'cool' },
        ],
      },
      {
        name: 'Sanctuary',
        icon: 'bath',
        lights: [
          { id: 'light.bathroom', name: 'Main Light', icon: 'lampWallDown' },
        ],
        scenes: [],
      },
      {
        name: 'Bedroom',
        icon: 'bedDouble',
        hasEnv: true,
        lights: [
          { id: 'light.bedroom', name: 'Main', icon: 'bedDouble' },
          { id: 'light.l_bedside_lamp', name: 'Bedside L', icon: 'lampDesk', brandIcon: 'DeskLamp' },
          { id: 'light.bedroom_light', name: 'Ceiling', icon: 'circleDot', brandIcon: 'CeilingRound' },
        ],
        scenes: [
          { id: 'scene.bedroom_beginnings', label: 'Sleep', icon: 'moon', gradient: 'sleep' },
          { id: 'scene.bedroom_read', label: 'Warm', icon: 'sunrise', gradient: 'warm' },
          { id: 'scene.bedroom_tokyo', label: 'Tokyo', icon: 'building2', gradient: 'tokyo' },
          { id: 'scene.bedroom_nighttime', label: 'Night', icon: 'moon', gradient: 'night' },
        ],
      },
      {
        name: 'Backyard',
        icon: 'landPlot',
        lights: [
          { id: 'light.patio', name: 'Patio', icon: 'lamp', mobileOrderClass: 'order-2 md:order-none' },
          { id: 'light.on_off_plug_1', name: 'Zone 1', icon: 'treePine', mobileOrderClass: 'order-3 md:order-none' },
          { id: 'light.on_off_plug_1_2', name: 'Zone 2', icon: 'treePine', mobileOrderClass: 'order-4 md:order-none' },
          { id: 'light.backyard', name: 'Backyard', icon: 'layers', mobileOrderClass: 'order-1 md:order-none' },
        ],
        scenes: [],
      },
    ],
  },
  media: {
    player: 'media_player.android_tv_192_168_2_88',
    powerSwitch: 'switch.entertainment_sys_2',
    remote: 'remote.xiaomi_tv_box',
    launchApps: [
      { name: 'Netflix', color: 'bg-red-600', script: 'script.netflix', icon: 'netflix' },
      { name: 'Spotify', color: 'bg-green-500', script: 'script.spotify', icon: 'spotify' },
      { name: 'YouTube', color: 'bg-red-500', script: 'script.youtube', icon: 'youtube' },
      { name: 'Prime', color: 'bg-blue-500', script: 'script.prime', icon: 'prime-video' },
    ],
  },
  security: {
    lock: 'lock.main_lock_matter',
    door: 'binary_sensor.lock_pro_f0e5',
    battery: 'sensor.lock_pro_f0e5_battery',
    masterSwitch: 'input_boolean.security_system',
    motion: [
      { label: 'Living Room Motion', entity: 'binary_sensor.tc71_person_detection_3' },
      { label: 'Main Door Motion', entity: 'binary_sensor.tc71_person_detection_2' },
    ],
    cameras: [
      { entityId: 'camera.tc71_minorstream', name: 'Living Room' },
      { entityId: 'camera.tc71_minorstream_2', name: 'Main Entrance' },
      { entityId: 'camera.xiaomi_pad_5', name: 'Kitchen' },
      { entityId: 'camera.main_cam_room_camera', name: 'Outhouse' },
    ],
  },
  energy: {
    dailyImport: 'sensor.eleused',
    dailyExport: 'sensor.daily_energy_export',
    dashboardImport: 'sensor.daily_energy_import',
    co2Intensity: 'sensor.electricity_maps_co2_intensity',
    fossilFuel: 'sensor.electricity_maps_grid_fossil_fuel_percentage',
  },
  network: {
    cpu: 'sensor.system_monitor_processor_use',
    memory: 'sensor.system_monitor_memory_usage',
    temperature: 'sensor.system_monitor_processor_temperature',
    download: 'sensor.speedtest_download',
    upload: 'sensor.speedtest_upload',
    ping: 'sensor.speedtest_ping',
    gridImport: 'sensor.electricity_monitor_ace3000_total_inz1',
    gridExport: 'sensor.electricity_monitor_ace3000_total_exz1',
    co2Intensity: 'sensor.electricity_maps_co2_intensity',
  },
  health: {
    heartRate: 'sensor.sm_s918b_heart_rate',
    restingHeartRate: 'sensor.sm_s918b_resting_heart_rate',
    oxygenSaturation: 'sensor.sm_s918b_oxygen_saturation',
    systolicBloodPressure: 'sensor.sm_s918b_systolic_blood_pressure',
    diastolicBloodPressure: 'sensor.sm_s918b_diastolic_blood_pressure',
    dailySteps: 'sensor.sm_s918b_daily_steps',
    watchSteps: 'sensor.galaxy_watch6_classic_1w4a_steps_sensor',
    calories: 'sensor.sm_s918b_total_calories_burned',
    floors: 'sensor.sm_s918b_daily_floors',
  },
};

export default estateEntities;
