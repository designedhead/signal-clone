import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  TouchableOpacity,
} from "react-native";
import React, { useLayoutEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Button, Image, Input, Text } from "react-native-elements";
import { auth, db, storage } from "../firebase";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync } from "expo-image-manipulator";

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [imageUrl, setImageUrl] = useState(
    "https://www.seekpng.com/png/full/110-1100707_person-avatar-placeholder.png"
  );

  const [uploading, setUploading] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerBackTitle: "Back to login",
    });
  }, [navigation]);

  const register = () => {
    auth
      .createUserWithEmailAndPassword(email, password)
      .then((authUser) => {
        authUser.user.updateProfile({
          displayName: name,
          photoURL:
            imageUrl,
        });
      })
      .catch((error) => alert(error.message));
    console.log(imageUrl);
  };

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
        setImageUrl(downloadURL);
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

  console.log(imageUrl);

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.container}>
      <StatusBar style="light" />
      <Text h3 style={{ marginBottom: 50 }}>
        Create a Signal account
      </Text>
      <TouchableOpacity onPress={pickImage}>
        <View style={styles.imageContainer}>
          <Image
            rounded
            style={styles.avatar}
            source={{
              uri: imageUrl,
            }}
          />
        </View>
      </TouchableOpacity>
      <Button title="Add Picture" onPress={pickImage} type="clear" />
      <View style={styles.inputContainer}>
        <Input
          placeholder="Full Name"
          autoFocus
          type="text"
          value={name}
          onChangeText={(text) => setName(text)}
        />
        <Input
          placeholder="Email"
          type="email"
          value={email}
          onChangeText={(text) => setEmail(text)}
        />
        <Input
          placeholder="Password"
          type="password"
          secureTextEntry
          value={password}
          onChangeText={(text) => setPassword(text)}
        />
      </View>
      <Button
        title="Register"
        onPress={register}
        raised
        containerStyle={styles.button}
      />
      <View style={{ height: 100 }} />
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    backgroundColor: "white",
  },
  button: {
    width: 200,
    marginTop: 10,
  },
  inputContainer: {
    width: 300,
  },
  imageContainer: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  avatar: {
    width: 100,
    height: 100,
    marginBottom: 20,
    borderRadius: 300,
    overflow: "hidden",
  },
});
