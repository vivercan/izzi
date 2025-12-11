import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, ExternalLink, Search } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface CatalogoFormatosVentaProps {
  onBack: () => void;
}

interface FormatoVenta {
  id: string;
  convenioVenta: string;
  origen: string;
  destino: string;
  destinoNickname: string;
  kilometrosIda: number;
  kilometrosRegreso: number;
  ubicacionUrl: string;
}

// 📋 CATÁLOGO PERMANENTE DE FORMATOS DE VENTA GRANJAS CARROLL
const CATALOGO_INICIAL: FormatoVenta[] = [
  // PUEBLA
  { id: '8415', convenioVenta: '8415', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'WALMART MONTERREY S CIENEGA CORREGIDORA', kilometrosIda: 2267, kilometrosRegreso: 57.34, ubicacionUrl: 'https://www.google.com/maps?cid=19.3588_-99.0092' },
  { id: '7695', convenioVenta: '7695', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'WALMART BRISAS DEL LAGO', kilometrosIda: 2486, kilometrosRegreso: 41.72, ubicacionUrl: 'https://www.google.com/maps?cid=25.9519_-100.173' },
  { id: '8463', convenioVenta: '8463', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ROMERO RUBIO VERACRUZ HUITZILA', kilometrosIda: 280, kilometrosRegreso: 8.28, ubicacionUrl: 'https://www.google.com/maps?cid=18.8635_-97.1355' },
  { id: '8612', convenioVenta: '8612', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'BODEGA AURRERA PUERTO ESCONDIDO EL ZAPOTE', kilometrosIda: 1236, kilometrosRegreso: 36.72, ubicacionUrl: 'https://www.google.com/maps?cid=16.9225_-98.1695' },
  { id: '10779', convenioVenta: '10779', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'WALMART DON QUIJOTE OAXACA', kilometrosIda: 572, kilometrosRegreso: 27.32, ubicacionUrl: 'https://www.google.com/maps?cid=17.1485_-96.7345' },
  { id: '8815', convenioVenta: '8815', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE ALONATHA ESTADO O LA PA JONACATEPEC', kilometrosIda: 2252, kilometrosRegreso: 12.32, ubicacionUrl: 'https://www.google.com/maps?cid=18.8021_-101.595' },
  { id: '9310', convenioVenta: '9310', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE O LA PLAYA PACHUCALA PAZ XOXTLA', kilometrosIda: 2252, kilometrosRegreso: 56.44, ubicacionUrl: 'https://www.google.com/maps?cid=19.5013_-98.9394' },
  { id: '9133', convenioVenta: '9133', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE EFREN MELACALLI PONTICLA', kilometrosIda: 1429, kilometrosRegreso: 40.58, ubicacionUrl: 'https://www.google.com/maps?cid=20.2103_-97.3915' },
  { id: '9488', convenioVenta: '9488', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE O LA PROVIDENCIA VERACRUZ ATZALLAN', kilometrosIda: 2517, kilometrosRegreso: 62.34, ubicacionUrl: 'https://www.google.com/maps?cid=19.1945_-96.1422' },
  { id: '9133', convenioVenta: '9133', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE EFREN MELACALLI PONTICLA', kilometrosIda: 1429, kilometrosRegreso: 40.58, ubicacionUrl: 'https://www.google.com/maps?cid=20.2103_-97.3915' },
  { id: '10510', convenioVenta: '10510', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ESTON PRODUCTVERACRUZ VERACRUZ POZA RICA', kilometrosIda: 494, kilometrosRegreso: 12.88, ubicacionUrl: 'https://www.google.com/maps?cid=19.1945_-96.1422' },
  { id: '10545', convenioVenta: '10545', origen: 'ORIENTAL PUEBLA', destino: 'ESTADO DE MEXICO', destinoNickname: 'ESTON DEL ANIMAS PEUBLA BODEGA AURRERA CARRETERA ATLIXCO IZUCAR', kilometrosIda: 250, kilometrosRegreso: 7.5, ubicacionUrl: 'https://www.google.com/maps?cid=19.0635_-98.4287' },
  { id: '10609', convenioVenta: '10609', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ESTON CARNES ESTEVEACRUZ EMILIANO ZAPATA', kilometrosIda: 435, kilometrosRegreso: 11.92, ubicacionUrl: 'https://www.google.com/maps?cid=19.3617_-96.5894' },
  { id: '10610', convenioVenta: '10610', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ESTON RON LILIA ALVARADO TLAZALAN', kilometrosIda: 435, kilometrosRegreso: 11.7, ubicacionUrl: 'https://www.google.com/maps?cid=19.3617_-96.5894' },
  { id: '10777', convenioVenta: '10777', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ESTON COMERCIO CHIHUAHUA CHIHUAHUSA', kilometrosIda: 3329, kilometrosRegreso: 78.58, ubicacionUrl: 'https://www.google.com/maps?cid=28.6752_-106.098' },
  { id: '9891', convenioVenta: '9891', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ESTON RANCHO CIUDAD DE XOCHIMILCO', kilometrosIda: 444, kilometrosRegreso: 11.88, ubicacionUrl: 'https://www.google.com/maps?cid=19.2542_-99.1025' },
  { id: '10081', convenioVenta: '10081', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE FLORAL MUNDO CIUDAD DE ME', kilometrosIda: 3395, kilometrosRegreso: 39.9, ubicacionUrl: 'https://www.google.com/maps?cid=20.6645_-101.3384' },
  { id: '10229', convenioVenta: '10229', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE WALMARTESTADO DE CUAUTITLAN', kilometrosIda: 2430, kilometrosRegreso: 66.6, ubicacionUrl: 'https://www.google.com/maps?cid=18.0522_-93.1855' },
  { id: '11127', convenioVenta: '11127', origen: 'ORIENTAL PUEBLA', destino: 'ESTADO DE CUAUTITLAN', destinoNickname: 'ORIENTE AURRERA CANANEA HERMOSILLO', kilometrosIda: 3642, kilometrosRegreso: 80.08, ubicacionUrl: 'https://www.google.com/maps?cid=29.0565_-106.3675' },
  { id: '11230', convenioVenta: '11230', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE JAROCHOLAS JALAPA', kilometrosIda: 502, kilometrosRegreso: 13.04, ubicacionUrl: 'https://www.google.com/maps?cid=19.5452_-96.9238' },
  { id: '10586', convenioVenta: '10586', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE PRODINDUSTRIA SALAMAN', kilometrosIda: 514, kilometrosRegreso: 13.28, ubicacionUrl: 'https://www.google.com/maps?cid=19.8145_-98.9590' },
  { id: '10620', convenioVenta: '10620', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE SUCHIOHUANALA SALAMAN', kilometrosIda: 3315, kilometrosRegreso: 78.3, ubicacionUrl: 'https://www.google.com/maps?cid=25.7272_-101.124' },
  { id: '10034', convenioVenta: '10034', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE ESTADO EL CERRILLO HUATUSCO', kilometrosIda: 1377, kilometrosRegreso: 39.54, ubicacionUrl: 'https://www.google.com/maps?cid=24.8847_-102.236' },
  { id: '10747', convenioVenta: '10747', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE JONATHAN ESTADO O LA PAZ', kilometrosIda: 218, kilometrosRegreso: 2.02, ubicacionUrl: 'https://www.google.com/maps?cid=19.3015_-98.5832' },
  { id: '10777', convenioVenta: '10777', origen: 'ORIENTAL PUEBLA', destino: 'ORIENTE O LA PROVIDENCIA', destinoNickname: 'COMERCIO CHIHUAHUA CHIHUAHUSA', kilometrosIda: 2252, kilometrosRegreso: 56.44, ubicacionUrl: 'https://www.google.com/maps?cid=19.5013_-98.9394' },
  { id: '10702', convenioVenta: '10702', origen: 'ESTADO DE CUAUTITLAN', destino: 'ORIENTE', destinoNickname: 'GRANJAS (PUEBLAC', kilometrosIda: 1258, kilometrosRegreso: 37.16, ubicacionUrl: 'https://www.google.com/maps?cid=18.9035_-99.1435' },
  { id: '10077', convenioVenta: '10077', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE AURRERA TABASCOLA PAZ XOXTLA', kilometrosIda: 442, kilometrosRegreso: 12.02, ubicacionUrl: 'https://www.google.com/maps?cid=19.2042_-99.1688' },
  { id: '10777', convenioVenta: '10777', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE COMERCIO CHIHUAHUA CHIHUAHUSA', kilometrosIda: 3329, kilometrosRegreso: 78.58, ubicacionUrl: 'https://www.google.com/maps?cid=28.6752_-106.098' },
  { id: '10078', convenioVenta: '10078', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE GILBERTO HIDALGO MINERAL I', kilometrosIda: 1211, kilometrosRegreso: 36.22, ubicacionUrl: 'https://www.google.com/maps?cid=20.0635_-98.7352' },
  { id: '10078', convenioVenta: '10078', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE AJ RAMAL CAXHUACAN MINERAL I', kilometrosIda: 456, kilometrosRegreso: 12.12, ubicacionUrl: 'https://www.google.com/maps?cid=19.0426_-98.1248' },
  { id: '9973', convenioVenta: '9973', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTAL SASA MILAONORA HERMOSIL', kilometrosIda: 4292, kilometrosRegreso: 97.84, ubicacionUrl: 'https://www.google.com/maps?cid=29.0985_-110.915' },
  { id: '10397', convenioVenta: '10397', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA CUAUTITLAN', destinoNickname: 'GOMELO PUEBLA', kilometrosIda: 1, kilometrosRegreso: 2.02, ubicacionUrl: 'https://www.google.com/maps?cid=19.0635_-98.4832' },
  { id: '11080', convenioVenta: '11080', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE BODEGA DE AURRESTA TOLUCA', kilometrosIda: 911, kilometrosRegreso: 24.12, ubicacionUrl: 'https://www.google.com/maps?cid=19.3001_-99.5904' },
  { id: '11188', convenioVenta: '11188', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE CODES ESTADO O TILANTLA', kilometrosIda: 518, kilometrosRegreso: 13.36, ubicacionUrl: 'https://www.google.com/maps?cid=19.6245_-99.1665' },
  { id: '10881', convenioVenta: '10881', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE LA BUENA MARQUES DEL CASTIL', kilometrosIda: 1311, kilometrosRegreso: 78.62, ubicacionUrl: 'https://www.google.com/maps?cid=18.5245_-99.1805' },
  { id: '10529', convenioVenta: '10529', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE WALMART NUEVO DE GENERAL I', kilometrosIda: 2430, kilometrosRegreso: 66.6, ubicacionUrl: 'https://www.google.com/maps?cid=18.0522_-93.1855' },
  { id: '11197', convenioVenta: '11197', origen: 'ORIENTAL PUEBLA', destino: 'ESTADO CUAUTITLAN', destinoNickname: 'ORIENTE BO AURRERA SAAVEDRA COMITAN', kilometrosIda: 3642, kilometrosRegreso: 80.08, ubicacionUrl: 'https://www.google.com/maps?cid=29.0565_-106.3675' },
  { id: '11230', convenioVenta: '11230', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE JAROCHOLAS JALAPA', kilometrosIda: 502, kilometrosRegreso: 13.04, ubicacionUrl: 'https://www.google.com/maps?cid=19.5452_-96.9238' },
  { id: '10586', convenioVenta: '10586', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE PRODINDUSTRIA SALAMAN', kilometrosIda: 514, kilometrosRegreso: 13.28, ubicacionUrl: 'https://www.google.com/maps?cid=19.8145_-98.9590' },
  { id: '10620', convenioVenta: '10620', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE SUCHIOHUANALA SALAMAN', kilometrosIda: 1003, kilometrosRegreso: 31.56, ubicacionUrl: 'https://www.google.com/maps?cid=20.5727_-101.124' },
  { id: '10034', convenioVenta: '10034', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE ESTADO EL CERRILLO HUATUSCO', kilometrosIda: 1377, kilometrosRegreso: 39.54, ubicacionUrl: 'https://www.google.com/maps?cid=24.8847_-102.236' },
  { id: '10747', convenioVenta: '10747', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE JONATHAN ESTADO O LA PAZ', kilometrosIda: 218, kilometrosRegreso: 2.02, ubicacionUrl: 'https://www.google.com/maps?cid=19.3015_-98.5832' },
  { id: '10777', convenioVenta: '10777', origen: 'ORIENTAL PUEBLA', destino: 'ORIENTE O LA PROVIDENCIA', destinoNickname: 'COMERCIO CHIHUAHUA CHIHUAHUSA', kilometrosIda: 478, kilometrosRegreso: 12.56, ubicacionUrl: 'https://www.google.com/maps?cid=19.3015_-98.5832' },
  { id: '10702', convenioVenta: '10702', origen: 'ESTADO DE CUAUTITLAN', destino: 'ORIENTE', destinoNickname: 'GRANJAS (PUEBLAC', kilometrosIda: 1258, kilometrosRegreso: 37.16, ubicacionUrl: 'https://www.google.com/maps?cid=18.9035_-99.1435' },
  { id: '10077', convenioVenta: '10077', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE AURRERA TABASCOLA PAZ XOXTLA', kilometrosIda: 1501, kilometrosRegreso: 42.02, ubicacionUrl: 'https://www.google.com/maps?cid=20.9625_-103.3695' },
  { id: '10899', convenioVenta: '10899', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE ARTURO F CIUDAD DE MILA ALT', kilometrosIda: 577, kilometrosRegreso: 14.54, ubicacionUrl: 'https://www.google.com/maps?cid=19.1911_-99.0765' },
  { id: '10850', convenioVenta: '10850', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE AURRERA VILLA ALTA PUEBLA', kilometrosIda: 515, kilometrosRegreso: 13.3, ubicacionUrl: 'https://www.google.com/maps?cid=19.0589_-99.2001' },
  { id: '11102', convenioVenta: '11102', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE JONATHAN ESTADO O LA PAZ', kilometrosIda: 523, kilometrosRegreso: 13.46, ubicacionUrl: 'https://www.google.com/maps?cid=19.3015_-98.5832' },
  { id: '11103', convenioVenta: '11103', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE AURORA ESTADO O LA PAZ', kilometrosIda: 425, kilometrosRegreso: 11.5, ubicacionUrl: 'https://www.google.com/maps?cid=19.3015_-98.5695' },
  { id: '11104', convenioVenta: '11104', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE SERVI CARRASCO GUAJALAI', kilometrosIda: 1534, kilometrosRegreso: 42.68, ubicacionUrl: 'https://www.google.com/maps?cid=19.3612_-95.6894' },
  { id: '11155', convenioVenta: '11155', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE COMERCIO MAZATLAN SINALOA', kilometrosIda: 4441, kilometrosRegreso: 11.84, ubicacionUrl: 'https://www.google.com/maps?cid=23.2469_-106.4062' },
  { id: '11167', convenioVenta: '11167', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE BODEGA DEAURRESTA GUADALAI', kilometrosIda: 957, kilometrosRegreso: 25.42, ubicacionUrl: 'https://www.google.com/maps?cid=20.6015_-103.3695' },
  { id: '11188', convenioVenta: '11188', origen: 'PUEBLA', destino: 'PUEBLA', destinoNickname: 'LA FAVORISTADO DE CUAUTITLAN', kilometrosIda: 617, kilometrosRegreso: 23.34, ubicacionUrl: 'https://www.google.com/maps?cid=19.6582_-99.1855' },
  { id: '11219', convenioVenta: '11219', origen: 'ORIENTAL PUEBLA', destino: 'ORIENTAL PUEBLA', destinoNickname: 'ABON ESTADO DE MEXICO', kilometrosIda: 523, kilometrosRegreso: 13.46, ubicacionUrl: 'https://www.google.com/maps?cid=19.3015_-98.5695' },
  { id: '11254', convenioVenta: '11254', origen: 'ESTADO DE CUAUTITLAN', destino: 'BAFAR DE CHIHUAHUA CHIHUAH', destinoNickname: 'BAFAR DE CHIHUAHUA', kilometrosIda: 246, kilometrosRegreso: 7.42, ubicacionUrl: 'https://www.google.com/maps?cid=28.6966_-106.125' },
  { id: '11272', convenioVenta: '11272', origen: 'ORIENTAL PUEBLA', destino: 'ESTADO ESTADO DE PUEBLA', destinoNickname: 'BIG JM MARTINEZ DE OAXACA', kilometrosIda: 442, kilometrosRegreso: 11.84, ubicacionUrl: 'https://www.google.com/maps?cid=19.3615_-98.9695' },
  { id: '10817', convenioVenta: '10817', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ATELIER CIUDAD DE VENUSTA', kilometrosIda: 601, kilometrosRegreso: 23.02, ubicacionUrl: 'https://www.google.com/maps?cid=19.4246_-99.1688' },
  { id: '10922', convenioVenta: '10922', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'AURRERA EL RAMALESTADO', kilometrosIda: 570, kilometrosRegreso: 14.4, ubicacionUrl: 'https://www.google.com/maps?cid=19.8871_-98.8608' },
  { id: '11393', convenioVenta: '11393', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE CLO RAESESTADO DEIALNEYA', kilometrosIda: 516, kilometrosRegreso: 13.32, ubicacionUrl: 'https://www.google.com/maps?cid=19.5987_-99.203' },
  { id: '11103', convenioVenta: '11103', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE EL BUENO ESTADO DE ZACAPOL', kilometrosIda: 560, kilometrosRegreso: 14.32, ubicacionUrl: 'https://www.google.com/maps?cid=19.5813_-99.8896' },
  { id: '11192', convenioVenta: '11192', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE ARTOMINO ESTADO', kilometrosIda: 566, kilometrosRegreso: 16.82, ubicacionUrl: 'https://www.google.com/maps?cid=19.4891_-99.1547' },
  { id: '11181', convenioVenta: '11181', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE ALIMIN ESTADO DEMEXICALT', kilometrosIda: 596, kilometrosRegreso: 14.92, ubicacionUrl: 'https://www.google.com/maps?cid=19.2093_-103.5847' },
  { id: '11206', convenioVenta: '11206', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE CARLOS IMONTEL VERACRUZ', kilometrosIda: 1500, kilometrosRegreso: 43.8, ubicacionUrl: 'https://www.google.com/maps?cid=19.7099_-103.3695' },
  { id: '11217', convenioVenta: '11217', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE WALMART ESTADO DE CUAUTITL', kilometrosIda: 484, kilometrosRegreso: 12.68, ubicacionUrl: 'https://www.google.com/maps?cid=19.8145_-99.2345' },
  { id: '11213', convenioVenta: '11213', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE AURRERA SALTILLO NI COAHUIL', kilometrosIda: 211, kilometrosRegreso: 6.72, ubicacionUrl: 'https://www.google.com/maps?cid=19.8005_-97.9024' },
  { id: '11258', convenioVenta: '11258', origen: 'PUEBLA', destino: 'PUEBLA', destinoNickname: 'JONATHAN ESTADO O LA PAZ', kilometrosIda: 324, kilometrosRegreso: 8.98, ubicacionUrl: 'https://www.google.com/maps?cid=19.3615_-98.9582' },
  { id: '11274', convenioVenta: '11274', origen: 'ORIENTAL PUEBLA', destino: 'ORIENTE O LA PROVIDENCIA', destinoNickname: 'ESTADO DE OAXACA', kilometrosIda: 563, kilometrosRegreso: 14.26, ubicacionUrl: 'https://www.google.com/maps?cid=16.9295_-93.4325' },
  { id: '11283', convenioVenta: '11283', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE EMPAPAD AGUASCA LESUS MAR', kilometrosIda: 563, kilometrosRegreso: 14.26, ubicacionUrl: 'https://www.google.com/maps?cid=19.6817_-96.8894' },
  { id: '10296', convenioVenta: '10296', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE LIBERTAD TORREON', kilometrosIda: 1543, kilometrosRegreso: 42.86, ubicacionUrl: 'https://www.google.com/maps?cid=28.7436_-103.3370' },
  { id: '10440', convenioVenta: '10440', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE IMRANCHO CIUDAD DE DEONMIL', kilometrosIda: 440, kilometrosRegreso: 11.8, ubicacionUrl: 'https://www.google.com/maps?cid=19.2542_-99.1025' },
  { id: '10705', convenioVenta: '10705', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE CARLOS OAXACA TUTUTEPEC', kilometrosIda: 518, kilometrosRegreso: 13.36, ubicacionUrl: 'https://www.google.com/maps?cid=19.6343_-99.2821' },
  { id: '10737', convenioVenta: '10737', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE MERVIN AURRERA SALAMAN', kilometrosIda: 1562, kilometrosRegreso: 43.76, ubicacionUrl: 'https://www.google.com/maps?cid=18.0156_-95.7945' },
  { id: '10741', convenioVenta: '10741', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE CONGLELISSINALOA CULIACAN', kilometrosIda: 2942, kilometrosRegreso: 70.84, ubicacionUrl: 'https://www.google.com/maps?cid=24.7855_-107.412' },
  { id: '10075', convenioVenta: '10075', origen: 'ORIENTAL PUEBLA', destino: 'ORIENTE LA PLAYA', destinoNickname: 'SAN ANDRES', kilometrosIda: 6143, kilometrosRegreso: 135.26, ubicacionUrl: 'https://www.google.com/maps?cid=24.9885_-110.932' },
  { id: '11100', convenioVenta: '11100', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE SUKARNE JALISCO ZAPOPLAN', kilometrosIda: 1561, kilometrosRegreso: 43.22, ubicacionUrl: 'https://www.google.com/maps?cid=20.6985_-103.3625' },
  { id: '11168', convenioVenta: '11168', origen: 'ORIENTAL PUEBLA', destino: 'ORIENTAL PUEBLA', destinoNickname: 'CO AURRERA GUADALAJARA JAL', kilometrosIda: 431, kilometrosRegreso: 11.62, ubicacionUrl: 'https://www.google.com/maps?cid=19.2542_-99.1025' },
  { id: '11200', convenioVenta: '11200', origen: 'PUEBLA', destino: 'PUEBLA', destinoNickname: 'COMERCIO CIUDAD DE OIFALCC', kilometrosIda: 416, kilometrosRegreso: 11.32, ubicacionUrl: 'https://www.google.com/maps?cid=19.4082_-99.0925' },
  { id: '11257', convenioVenta: '11257', origen: 'ESTADO CUAUTITLAN', destino: 'ESTADO', destinoNickname: 'BAFAR DE CUAUTITLAN', kilometrosIda: 240, kilometrosRegreso: 7.3, ubicacionUrl: 'https://www.google.com/maps?cid=19.8615_-98.9525' },
  { id: '11273', convenioVenta: '11273', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE SUCHIOHUANALA SALAMAN', kilometrosIda: 1003, kilometrosRegreso: 31.56, ubicacionUrl: 'https://www.google.com/maps?cid=20.5727_-101.124' },
  { id: '8356', convenioVenta: '8356', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'AURRERA BODEGA DE VERACRUZ', kilometrosIda: 489, kilometrosRegreso: 12.98, ubicacionUrl: 'https://www.google.com/maps?cid=19.5415_-98.9659' },
  { id: '8429', convenioVenta: '8429', origen: 'ORIENTAL PUEBLA', destino: 'PUEBLA', destinoNickname: 'ORIENTE EMPAPAD ESTADO O LA PAZ', kilometrosIda: 402, kilometrosRegreso: 11.04, ubicacionUrl: 'https://www.google.com/maps?cid=19.4212_-99.1014' },
  { id: '8333', convenioVenta: '8333', origen: 'ORIENTAL PUEBLA', destino: 'ORIENTAL PROVIDENCIA', destinoNickname: 'VERACRUZ JUCHIQUE DE HERRARAL', kilometrosIda: 352, kilometrosRegreso: 9.54, ubicacionUrl: 'https://www.google.com/maps?cid=18.9701_-95.7445' },
];

export const CatalogoFormatosVenta = ({ onBack }: CatalogoFormatosVentaProps) => {
  const [formatos, setFormatos] = useState<FormatoVenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    cargarFormatos();
  }, []);

  const cargarFormatos = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/formatos-venta`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.formatos && data.formatos.length > 0) {
          setFormatos(data.formatos);
        } else {
          // Si no hay formatos en backend, usar el catálogo inicial
          setFormatos(CATALOGO_INICIAL);
        }
      } else {
        // En caso de error, usar el catálogo inicial
        setFormatos(CATALOGO_INICIAL);
      }
    } catch (error) {
      console.error('Error cargando formatos:', error);
      // En caso de error, usar el catálogo inicial
      setFormatos(CATALOGO_INICIAL);
    }
    setLoading(false);
  };

  const formatosFiltrados = formatos.filter(formato => 
    formato.convenioVenta.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formato.destino.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formato.destinoNickname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0056B8 0%, #0B84FF 100%)' }}>
      {/* HEADER */}
      <div className="px-5 py-4 border-b" style={{ backgroundColor: '#0B1220', borderColor: '#1E293B' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-white" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '20px', fontWeight: 700 }}>
                CATÁLOGO DE FORMATOS DE VENTA
              </h1>
              <p className="text-slate-400" style={{ fontSize: '12px' }}>
                {formatos.length} formatos registrados
              </p>
            </div>
          </div>

          {/* BUSCADOR */}
          <div className="relative" style={{ width: '300px' }}>
            <input
              type="text"
              placeholder="Buscar por convenio o destino..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 rounded-lg"
              style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '13px',
                background: '#1E293B',
                border: '1.5px solid #475569',
                color: 'white',
                outline: 'none'
              }}
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="px-5 py-4">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px' }}>
              Cargando catálogo...
            </p>
          </div>
        ) : (
          <div className="bg-white shadow border border-slate-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-700 border-b border-slate-600">
                    <th className="px-3 py-2 text-left text-white" style={{ fontSize: '11px', fontWeight: 700 }}>CONVENIO</th>
                    <th className="px-3 py-2 text-left text-white" style={{ fontSize: '11px', fontWeight: 700 }}>ORIGEN</th>
                    <th className="px-3 py-2 text-left text-white" style={{ fontSize: '11px', fontWeight: 700 }}>DESTINO</th>
                    <th className="px-3 py-2 text-left text-white" style={{ fontSize: '11px', fontWeight: 700 }}>DESTINO NICKNAME</th>
                    <th className="px-3 py-2 text-right text-white" style={{ fontSize: '11px', fontWeight: 700 }}>KM IDA</th>
                    <th className="px-3 py-2 text-right text-white" style={{ fontSize: '11px', fontWeight: 700 }}>KM REGRESO</th>
                    <th className="px-3 py-2 text-center text-white" style={{ fontSize: '11px', fontWeight: 700 }}>UBICACIÓN</th>
                  </tr>
                </thead>
                <tbody>
                  {formatosFiltrados.map((formato, idx) => (
                    <tr key={formato.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-3 py-2">
                        <div className="text-slate-900" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '12px', fontWeight: 700 }}>
                          {formato.convenioVenta}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate-700" style={{ fontSize: '11px' }}>
                        {formato.origen}
                      </td>
                      <td className="px-3 py-2 text-slate-700" style={{ fontSize: '11px' }}>
                        {formato.destino}
                      </td>
                      <td className="px-3 py-2 text-slate-700" style={{ fontSize: '11px' }}>
                        {formato.destinoNickname}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="text-slate-900" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '11px', fontWeight: 700 }}>
                          {formato.kilometrosIda.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="text-slate-900" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '11px', fontWeight: 700 }}>
                          {formato.kilometrosRegreso.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <a
                          href={formato.ubicacionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
                          style={{
                            background: '#EFF6FF',
                            border: '1px solid #3B82F6',
                            color: '#3B82F6',
                            fontSize: '10px',
                            fontWeight: 600
                          }}
                        >
                          <MapPin className="w-3 h-3" />
                          Ver Mapa
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
