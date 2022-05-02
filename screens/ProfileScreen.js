import { StyleSheet, TouchableOpacity, SafeAreaView, View } from "react-native";
import React, { useLayoutEffect, useState } from "react";
import { Avatar, Button, Image, Input } from "react-native-elements";
import { StatusBar } from "expo-status-bar";
import { auth, db, storage } from "../firebase";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync } from "expo-image-manipulator";

const ProfileScreen = ({ navigation }) => {
  const [uploading, setUploading] = useState(false);

  const signOutUser = () => {
    auth.signOut().then(() => {
      navigation.replace("Login");
    });
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Profile",
    });
  }, [navigation]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.cancelled) {
      try {
        resizeImage(result.uri);
        //uploadImageToBucket(result.uri);
        console.log("tried to upload image to bucket");
      } catch (e) {
        alert(e.message);
      }
    }
  };

  const resizeImage = async (uri) => {
    const manipResult = await manipulateAsync(
      uri,
      [{ resize: { width: 400, height: 400 } }],
      { compress: 0.7, format: "jpeg" }
    );
    console.log("result", manipResult);
    uploadImageToBucket(manipResult.uri);
  };

  const getPictureBlob = (uri) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function (e) {
        reject(new TypeError("Network request failed"));
      };
      xhr.responseType = "blob";
      xhr.open("GET", uri, true);
      xhr.send(null);
    });
  };
  //Make Random String for Image
  function makeid(length) {
    var result = "";
    var characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  //   console.log(makeid(5));

  const uploadImageToBucket = async (t) => {
    let blob;
    try {
      setUploading(true);
      blob = await getPictureBlob(t);

      const ref = await storage.ref().child(makeid(15));
      const snapshot = await ref.put(blob);

      return await snapshot.ref.getDownloadURL().then(function (downloadURL) {
        auth.currentUser.updateProfile({
          photoURL: downloadURL,
        });
      });
    } catch (e) {
      alert(e.message);
      console.log("Error state");
    } finally {
      blob.close();
      setUploading(false);
      console.log("state", uploading);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.topContainer}>
        <Image
          rounded
          style={styles.avatar}
          source={{ uri: auth.currentUser.photoURL + "?" + new Date() }}
          key={auth.currentUser.photoURL + "?" + new Date()}
        />
        <Button title="Change Picture" onPress={pickImage} type="clear" />
        <Input value={auth.currentUser.displayName} disabled />
        <Input value={auth.currentUser.email} disabled />
      </View>
      <View>
        <TouchableOpacity>
          <Button title="Sign out" onPress={signOutUser} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    margin: 10,
  },
  topContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    marginBottom: 20,
    borderRadius: 300,
    overflow: "hidden",
  },
});
