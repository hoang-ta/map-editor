import React, { useState } from 'react';
import DeckGL from '@deck.gl/react';
import {
  ViewMode,
  EditableGeoJsonLayer,
} from '@deck.gl-community/editable-layers';
import { Toolbox } from './toolbox/toolbox';
import StaticMap from 'react-map-gl/maplibre';
import { data } from './data';

const initialViewState = {
  longitude: 139.7654711623127,
  latitude: 35.830900143089295,
  zoom: 5.9,
};

export function Example() {
  const [geoJson, setGeoJson] = useState(data);
  const [
    selectedFeatureIndexes,
    setSelectedFeatureIndexes,
  ] = useState([0]);
  const [mode, setMode] = useState(() => ViewMode);
  const [modeConfig, setModeConfig] = useState({});

  const layer = new EditableGeoJsonLayer({
    data: geoJson,
    mode,
    modeConfig,
    selectedFeatureIndexes,
    onEdit: ({ updatedData }) => {
      setGeoJson(updatedData);
    },
  });

  return (
    <>
      <DeckGL
        initialViewState={initialViewState}
        controller={{
          doubleClickZoom: false,
        }}
        layers={[layer]}
        getCursor={layer.getCursor.bind(layer)}
        onClick={(info) => {
          console.log(info);
          if (mode === ViewMode)
            if (info) {
              setSelectedFeatureIndexes([info.index]);
            } else {
              setSelectedFeatureIndexes([]);
            }
        }}
        onViewStateChange={(info) => {
          console.log(info);
        }}
      >
        <StaticMap
          mapStyle={
            'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
          }
        />
      </DeckGL>

      <Toolbox
        left={true}
        geoJson={geoJson}
        mode={mode}
        modeConfig={modeConfig}
        onSetMode={setMode}
        onSetModeConfig={setModeConfig}
        onImport={(imported) =>
          setGeoJson({
            ...geoJson,
            features: [
              ...geoJson.features,
              ...imported.features,
            ],
          })
        }
        onSetGeoJson={setGeoJson}
      />
    </>
  );
}
