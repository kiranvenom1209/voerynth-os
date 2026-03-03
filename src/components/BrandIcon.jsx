import React from 'react';

// Import the SVG icons as URLs
import HueOnlyIcon from '../assets/brand-icons/hue-only.svg';
import XiaomiLogoIcon from '../assets/brand-icons/xiaomi-logo.svg';
import AqaraCubeIcon from '../assets/brand-icons/aqara-cube.svg';
import GoogleHomeIcon from '../assets/brand-icons/google-home.svg';
import EsphomeIcon from '../assets/brand-icons/esphome.svg';
import TuyaIcon from '../assets/brand-icons/tuya.svg';
import NetflixIcon from '../assets/brand-icons/netflix.svg';
import YoutubeIcon from '../assets/brand-icons/youtube.svg';
import SpotifyIcon from '../assets/brand-icons/spotify.svg';
import PrimeVideoIcon from '../assets/brand-icons/prime-video.svg';
import DisneyPlusIcon from '../assets/brand-icons/disney-plus.svg';
import HuluIcon from '../assets/brand-icons/hulu.svg';
import MaxIcon from '../assets/brand-icons/max.svg';
import AppleTvIcon from '../assets/brand-icons/apple-tv.svg';
import PlexIcon from '../assets/brand-icons/plex.svg';
import JellyfinIcon from '../assets/brand-icons/jellyfin.svg';
import EmbyIcon from '../assets/brand-icons/emby.svg';
import TwitchIcon from '../assets/brand-icons/twitch.svg';
import CeilingRoundIcon from '../assets/brand-icons/CeilingRound.svg';
import IrisIcon from '../assets/brand-icons/Iris.svg';
import DeskLampIcon from '../assets/brand-icons/DeskLamp.svg';
import BulbsClassicIcon from '../assets/brand-icons/bulbsClassic.svg';
import ChandelierIcon from '../assets/brand-icons/chandelier.svg';
import BulbsSpotIcon from '../assets/brand-icons/bulbsSpot.svg';

/**
 * BrandIcon Component
 *
 * A wrapper component for custom brand icons from the custom-brand-icons repository
 *
 * Usage: <BrandIcon name="hue-only" size={24} className="text-amber-500" />
 */

// Icon mapping
const iconMap = {
  'hue-only': HueOnlyIcon,
  'xiaomi-logo': XiaomiLogoIcon,
  'aqara-cube': AqaraCubeIcon,
  'google-home': GoogleHomeIcon,
  'esphome': EsphomeIcon,
  'tuya': TuyaIcon,
  'netflix': NetflixIcon,
  'youtube': YoutubeIcon,
  'spotify': SpotifyIcon,
  'prime-video': PrimeVideoIcon,
  'disney-plus': DisneyPlusIcon,
  'hulu': HuluIcon,
  'max': MaxIcon,
  'apple-tv': AppleTvIcon,
  'plex': PlexIcon,
  'jellyfin': JellyfinIcon,
  'emby': EmbyIcon,
  'twitch': TwitchIcon,
  'CeilingRound': CeilingRoundIcon,
  'Iris': IrisIcon,
  'DeskLamp': DeskLampIcon,
  'bulbsClassic': BulbsClassicIcon,
  'chandelier': ChandelierIcon,
  'bulbsSpot': BulbsSpotIcon,
};

const BrandIcon = ({ name, size = 24, className = "", style = {} }) => {
  const iconUrl = iconMap[name];

  if (!iconUrl) {
    console.warn(`BrandIcon: Icon "${name}" not found`);
    return null;
  }

  // Extract custom color if provided
  const customColor = style.color;

  // Build filter: make white, then add colored drop-shadow for tinting effect
  let filterValue = 'brightness(0) saturate(100%) invert(1)';

  if (customColor) {
    // Add multiple drop-shadows in the custom color to create a glow/tint effect
    filterValue += ` drop-shadow(0 0 1px ${customColor}) drop-shadow(0 0 2px ${customColor})`;
  }

  return (
    <img
      src={iconUrl}
      alt={name}
      width={size}
      height={size}
      className={className}
      style={{
        display: 'inline-block',
        filter: filterValue,
        opacity: customColor ? 0.9 : 0.7,
        transition: 'filter 0.5s, opacity 0.5s',
        ...style,
        color: undefined // Remove color from being passed through
      }}
    />
  );
};

export default React.memo(BrandIcon);

