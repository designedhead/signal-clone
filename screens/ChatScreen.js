import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import React, { useLayoutEffect, useState } from "react";
import { Avatar } from "react-native-elements";
import { AntDesign, FontAwesome, Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { db, auth } from "../firebase";
import * as firebase from "firebase";
import { Platform } from "react-native";

const ChatScreen = ({ navigation, route }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Chat",
      headerBackTitleVisible: false,
      headerTitleAlign: "left",
      headerTitle: () => (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Avatar
            rounded
            source={{
              uri: "https://www.seekpng.com/png/full/110-1100707_person-avatar-placeholder.png",
            }}
          />
          <Text style={{ color: "white", marginLeft: 10, fontWeight: "700" }}>
            {route.params.chatName}
          </Text>
        </View>
      ),
      headerRight: () => (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",

            width: 80,
            marginRight: 0,
          }}
        >
          <TouchableOpacity>
            <FontAwesome name="video-camera" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons
              name="call"
              size={20}
              color="white"
              style={{ marginLeft: 20 }}
            />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, messages]);

  const sendMessage = () => {
    const fieldValue = firebase.firestore.FieldValue;
    Keyboard.dismiss;
    db.collection("chats").doc(route.params.id).collection("messages").add({
      timestamp: fieldValue.serverTimestamp(),
      message: input,
      displayName: auth.currentUser.displayName,
      email: auth.currentUser.email,
      photoURL: auth.currentUser.photoURL,
    });
    setInput("");
  };

  useLayoutEffect(() => {
    const unsubscribe = db
      .collection("chats")
      .doc(route.params.id)
      .collection("messages")
      .orderBy("timestamp", "desc")
      .onSnapshot((snapshot) =>
        setMessages(
          snapshot.docs.map((doc) => ({
            id: firebase.database.id,
            data: doc.data(),
          }))
        )
      );
    return unsubscribe;
  }, [route]);

  return (
    <SafeAreaView>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={90}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <>
            <ScrollView
              contentContainerStyle={{
                paddingTop: 15,
                flex: 1,
                flexDirection: "column-reverse",
              }}
            >
              {messages.map(({ id, data }) =>
                data.email === auth.currentUser.email ? (
                  <View key={id} style={styles.sender}>
                    <Text style={styles.senderText}>{data.message}</Text>
                    <Avatar
                      rounded
                      size={30}
                      source={{ uri: data.photoURL }}
                      position="absolute"
                      bottom={-15}
                      left={-15}
                    />
                  </View>
                ) : (
                  <View key={id} style={styles.receiver}>
                    <Avatar
                      rounded
                      size={30}
                      source={{ uri: data.photoURL }}
                      position="absolute"
                      bottom={-15}
                      right={-15}
                    />
                    <Text style={styles.receiverText}>{data.message}</Text>
                    <Text style={styles.receiverName}>{data.displayName}</Text>
                  </View>
                )
              )}
            </ScrollView>
            <View style={styles.footer}>
              <TextInput
                placeholder="Please write your message"
                style={styles.input}
                value={input}
                onChangeText={(text) => setInput(text)}
                onSubmitEditing={sendMessage}
              />
              <TouchableOpacity onPress={sendMessage} activeOpacity={0.5}>
                <Ionicons name="send" size={24} color="#2B68e6" />
              </TouchableOpacity>
            </View>
          </>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: { height: "100%" },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    padding: 15,
  },
  input: {
    height: 40,
    bottom: 0,
    flex: 1,
    marginRight: 15,
    borderColor: "transparent",
    backgroundColor: "#e3e3e3",
    borderWidth: 1,
    padding: 10,
    color: "grey",
    borderRadius: 30,
  },
  receiver: {
    padding: 15,
    backgroundColor: "#ECECEC",
    alignSelf: "flex-end",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    marginRight: 20,
    marginBottom: 20,
    maxWidth: "80%",
    position: "relative",
  },
  sender: {
    padding: 15,
    backgroundColor: "#4f64ff",
    alignSelf: "flex-start",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    marginLeft: 20,
    marginBottom: 20,
    maxWidth: "80%",
    position: "relative",
  },
  receiverText: {},
  senderText: {
    color: "white",
  },
  receiverName: {
    fontSize: 10,
    color: "#bdbdbd",
    alignSelf: "flex-end",
  },
});
