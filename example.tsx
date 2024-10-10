import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import DeckGL from '@deck.gl/react';
import {
  ViewMode,
  EditableGeoJsonLayer,
  DrawCircleFromCenterMode,
  DrawRectangleMode,
} from '@deck.gl-community/editable-layers';
import { Toolbox } from './toolbox/toolbox';
import StaticMap from 'react-map-gl/maplibre';
import { data } from './data';
import { PointCloudLayer } from '@deck.gl/layers';
import {
  LASLoader,
  LASWorkerLoader,
} from '@loaders.gl/las';
import {
  COORDINATE_SYSTEM,
  MapViewState,
} from '@deck.gl/core';
import { parse } from '@loaders.gl/core';
import { Matrix4 } from '@math.gl/core';
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Drawer,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import LoadIcon from '@mui/icons-material/Refresh';
import { v4 as uuidv4 } from 'uuid';
import { RotationControl } from './components/rotation-control';
import { AppBar } from './components/app-bar';
function getShapeName(feature: any): string {
  if (feature.properties && feature.properties.shapeType) {
    return feature.properties.shapeType;
  }
  switch (feature.geometry.type) {
    case 'Point':
      return 'Point';
    case 'LineString':
      return 'Line';
    case 'Polygon':
      return 'Polygon';
    default:
      return 'Shape';
  }
}

const initialViewState = {
  longitude: 139.7654711623127,
  latitude: 35.830900143089295,
  zoom: 17.8,
};

// Data source: kaarta.com
const LAZ_SAMPLE =
  'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/point-cloud-laz/indoor.0.1.laz';

type LASMesh = (typeof LASWorkerLoader)['dataType'];

export function Example() {
  const [geoJson, setGeoJson] = useState(data);
  const [pcd, setPcd] = useState(null);
  const [
    selectedFeatureIndexes,
    setSelectedFeatureIndexes,
  ] = useState([0]);
  const [mode, setMode] = useState(() => ViewMode);
  const [modeConfig, setModeConfig] = useState({});

  const [history, setHistory] = useState([data]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [drawerOpen, setDrawerOpen] = useState(true);

  // Add new state for saved feature lists to show on drawer
  const [savedFeatureLists, setSavedFeatureLists] =
    useState<string[]>([]);

  // Add new state for rotation angles for editing point cloud
  const [rotation, setRotation] = useState({
    x: 0,
    y: 0,
    z: 0,
  });

  // Add view state to control the camera in 2d or 3d depending on the mode
  const [viewState, setViewState] = useState<MapViewState>({
    ...initialViewState,
    bearing: 0,
    pitch: 0,
  });

  // Load saved feature lists from local storage on component mount
  useEffect(() => {
    const savedLists = localStorage.getItem(
      'savedFeatureLists'
    );
    if (savedLists) {
      setSavedFeatureLists(JSON.parse(savedLists));
    }
  }, []);

  // Add this useEffect to reset the bearing when switching out of view mode
  useEffect(() => {
    if (mode !== ViewMode) {
      setViewState((prevState) => ({
        ...prevState,
        bearing: 0,
        pitch: 0,
      }));
    }
  }, [mode]);

  const onViewStateChange = useCallback(({ viewState }) => {
    setViewState(viewState);
  }, []);

  const editLayer = new EditableGeoJsonLayer({
    data: geoJson as any,
    mode,
    modeConfig,
    selectedFeatureIndexes,
    onEdit: ({
      updatedData,
      editType,
      featureIndexes,
      editContext,
    }) => {
      // Add shapeType and id properties to new features
      if (editType === 'addFeature') {
        const newFeatures = updatedData.features.map(
          (feature, index) => {
            if (
              editContext?.featureIndexes?.includes(index)
            ) {
              let shapeType = getShapeName(feature);
              if (
                mode.name === DrawCircleFromCenterMode.name
              ) {
                shapeType = 'Circle';
              } else if (
                mode.name === DrawRectangleMode.name
              ) {
                shapeType = 'Rectangle';
              }
              return {
                ...feature,
                properties: {
                  ...feature.properties,
                  id: uuidv4(),
                  shapeType,
                },
              };
            }
            return feature;
          }
        );
        updatedData = {
          ...updatedData,
          features: newFeatures,
        };
      }

      setGeoJson(updatedData);

      // Only update history when the edit is finished
      if (editType === 'addFeature') {
        const newHistory = history.slice(
          0,
          historyIndex + 1
        );
        newHistory.push(updatedData);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    },
  });

  const pcdLayers = [
    pcd &&
      new PointCloudLayer<LASMesh>({
        id: 'sample-pcd',
        data: pcd,
        pointSize: 2,
        coordinateOrigin: [
          139.7654711623127, 35.830900143089295, 0,
        ],
        coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
        modelMatrix: new Matrix4()
          .rotateX((rotation.x * Math.PI) / 180)
          .rotateY((rotation.y * Math.PI) / 180)
          .rotateZ((rotation.z * Math.PI) / 180),
      }),
  ];

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const data = await parse(file, LASLoader);
      setPcd(data);
    }
  };

  const fetchPcdData = async () => {
    const data = await parse(fetch(LAZ_SAMPLE), LASLoader);
    setPcd(data);
  };

  useEffect(() => {
    fetchPcdData();
  }, []);

  // Add these new functions to handle undo and redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setGeoJson(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setGeoJson(history[historyIndex + 1]);
    }
  };

  const handleDeleteShape = (index: number) => {
    const updatedFeatures = geoJson.features.filter(
      (_, i) => i !== index
    );
    const updatedGeoJson = {
      ...geoJson,
      features: updatedFeatures,
    };
    setGeoJson(updatedGeoJson);

    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(updatedGeoJson);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Function to save current features to local storage
  const saveFeatureList = () => {
    const newList = JSON.stringify(geoJson.features);
    const updatedLists = [...savedFeatureLists, newList];
    setSavedFeatureLists(updatedLists);
    localStorage.setItem(
      'savedFeatureLists',
      JSON.stringify(updatedLists)
    );
  };

  // Function to load a saved feature list
  const loadFeatureList = (index: number) => {
    const loadedFeatures = JSON.parse(
      savedFeatureLists[index]
    );
    setGeoJson({ ...geoJson, features: loadedFeatures });

    // Update history
    const newHistory = [
      ...history,
      { ...geoJson, features: loadedFeatures },
    ];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Add this new function to clear saved feature lists from drawers
  const clearSavedFeatureLists = () => {
    setSavedFeatureLists([]);
    localStorage.removeItem('savedFeatureLists');
  };

  // Add a function to handle rotation changes
  const handleRotationChange =
    (axis: 'x' | 'y' | 'z') =>
    (event: Event, newValue: number | number[]) => {
      setRotation((prev) => ({
        ...prev,
        [axis]: newValue as number,
      }));
    };

  const clearPCDData = () => {
    setPcd(null);
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <DeckGL
        viewState={viewState}
        controller={{
          doubleClickZoom: false,
          dragRotate: mode === ViewMode,
          touchRotate: mode === ViewMode,
        }}
        onViewStateChange={onViewStateChange}
        layers={[editLayer, ...pcdLayers]}
        getCursor={editLayer.getCursor.bind(editLayer)}
        onClick={(info) => {
          if (mode === ViewMode) {
            if (info) {
              setSelectedFeatureIndexes([info.index]);
            } else {
              setSelectedFeatureIndexes([]);
            }
          }
        }}
      >
        <StaticMap
          mapStyle={
            'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
          }
        />
      </DeckGL>

      {/* Add the drawer to show the list of shapes drawn on map and other controls */}
      <Drawer
        anchor='right'
        variant='persistent'
        open={drawerOpen}
        sx={{
          width: 300,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 300,
            boxSizing: 'border-box',
          },
        }}
      >
        <AppBar
          handleUndo={handleUndo}
          handleRedo={handleRedo}
          saveFeatureList={saveFeatureList}
          clearSavedFeatureLists={clearSavedFeatureLists}
          clearPCDData={clearPCDData}
          fileInputRef={fileInputRef}
          historyIndex={historyIndex}
          history={history}
          handleFileUpload={handleFileUpload}
        />
        <List
          sx={{
            overflow: 'auto',
            maxHeight: 'calc(100% - 64px)',
          }}
        >
          {geoJson.features.map((feature, index) => (
            <ListItem key={feature.properties?.id || index}>
              <ListItemText
                primary={`${getShapeName(feature)} ${
                  index + 1
                }`}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge='end'
                  aria-label='delete'
                  onClick={() => handleDeleteShape(index)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
          {/* Add saved feature lists to show list of shapes drawn on map */}
          {savedFeatureLists.map((_, index) => (
            <ListItem key={`saved-list-${index}`}>
              <ListItemText
                primary={`Saved List ${index + 1}`}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge='end'
                  aria-label='load'
                  onClick={() => loadFeatureList(index)}
                >
                  <LoadIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Drawer>

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
      <RotationControl
        rotation={rotation}
        handleRotationChange={handleRotationChange}
      />
    </>
  );
}
