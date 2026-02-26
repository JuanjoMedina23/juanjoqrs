import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useState } from "react";
import { Alert, Button, StyleSheet, Text, View } from "react-native";

export function QrScanner(){
    const [Escaneado, SetEscaneo] = useState(false);

    const handleBarcodeScanned = ({type,data})=>{
        SetEscaneo(true);
        Alert.alert(
            "Si se escaneo xd",
            `Tipo: ${type}\nContenido: ${data}`,
            [{text:"ok", onPress: ()=>SetEscaneo(false)}]
        );
    };
    
    return(
        <View style={estilos.contenedor}>
            <CameraView 
            style={StyleSheet.absoluteFillObject}
            onBarcodeScanned={Escaneado ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{
                barcodeTypes: [
                    "qr", //Analiza codigo de QR
                    "ean13", //Aniliza codigo de barras ean-13
                    "code128"//Analiza codigo de barras code-128
                ],
            }}
        />
        {Escaneado && (
            <View style={estilos.overlay}>
                <Text style={estilos.text}>Escaneando...</Text>
            </View>
        )
        }
        </View>
    );
}




export default function App(){
    const [TienePermiso, PedirPermiso] = useCameraPermissions();
    if (!TienePermiso)
     {//Si tiene persimos no muestra nada, solo la vista xd
        return <View/>
     }
     if(!TienePermiso.granted)
    {//Si no tiene permisos otorgados entonces se muestra el boton
        return(
            <View style= {{flex :1 , justifyContent: 'center', alignItems:'center'}}>
                <Text style ={{textAlign: 'center'}}>Dame acceso a la Xcam</Text>
                <Button onPress={PedirPermiso} title="Pedir Acceso" />
            </View>
        );
    }
    return (
        <View style={{flex:1}}>
            <CameraView style={{flex:1}}/>
        </View>
    );
}


const estilos = StyleSheet.create({
    contenedor: {flex:1},
    overlay:{
        position: 'absolute',
        bottom: 50,
        alignSelf: 'center',
        backgroundColor: '#87CEEB',
        padding: 20,
        borderRadius:10
    },
    text : {color: 'black', fontWeight: 'bold'}
});