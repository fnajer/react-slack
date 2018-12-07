import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import "firebase/storage";

var config = {
  apiKey: "AIzaSyB6mLLhf9MckCBnI9Gkc4VVAY58jGtdvV4",
  authDomain: "react-slack-304c1.firebaseapp.com",
  databaseURL: "https://react-slack-304c1.firebaseio.com",
  projectId: "react-slack-304c1",
  storageBucket: "react-slack-304c1.appspot.com",
  messagingSenderId: "344940897350"
};
firebase.initializeApp(config);

export default firebase;