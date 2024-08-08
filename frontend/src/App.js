import { Buffer } from "buffer";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import {
  createThirdwebClient,
  getContract,
  prepareContractCall,
  readContract,
} from "thirdweb";
import { hardhat, sepolia } from "thirdweb/chains";
import {
  ConnectEmbed,
  ThirdwebProvider,
  useActiveAccount,
  useSendAndConfirmTransaction,
} from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";
import contractData from "./contracts/BookShelf.json";

const client = createThirdwebClient({
  clientId: process.env.REACT_APP_CLIENT_ID,
});

const wallets = [
  createWallet("io.metamask"),
  createWallet("app.phantom"),
  createWallet("me.rainbow"),
];

const contract1 = getContract({
  client,
  chain: sepolia,
  address: "0x360D70542Fe578A4d614179D71048599C33d3007",
  abi: contractData.abi,
});

function PurchasedBook({ bookId, activeAccount }) {
	const [bookData, setBookData] = useState(null);
  
	useEffect(() => {
	  const fetchPurchasedBookData = async () => {
		try {
		  const bookMetadata = await readContract({
			contract: contract1,
			method: "getPurchasedBookData",
			params: [bookId], // Pass the bookId as an argument
		  });
		  console.log(bookMetadata, activeAccount.address)
		  setBookData(bookMetadata);
		} catch (error) {
		  console.error("Error fetching book data:", error);
		}
	  };
  
	  fetchPurchasedBookData();
	}, [bookId]);
  
	if (!bookData) {
	  return <div>Loading...</div>;
	}
  
	const decodeBytes = (bytesData) => {
		return Buffer.from(bytesData.slice(2), 'hex').toString();
	  };
	
	  return (
		<div>
		  <h2>Book Title: {decodeBytes(bookData.title)}</h2>
		  <p>Author: {decodeBytes(bookData.author_name)}</p>
		  <p>Published on: {decodeBytes(bookData.published_date)}</p>
		  <p>Content: {decodeBytes(bookData.content)}</p>
		  <p>Price: {bookData.price} ETH</p>
		  <p>Status: {bookData.status === 1 ? "Available" : "Not Available"}</p>
		</div>
	  );
  }

// const PurchasedBooks = ({ activeAccount, author }) => {
// 	const [purchasedBooks, setPurchasedBooks] = useState([]);
  
// 	useEffect(() => {
// 	  const fetchPurchasedBooks = async () => {
// 		if (!activeAccount || activeAccount.address === author) return;
  
// 		const cleanPurchasedBooks = [];
// 		try {
// 		  // Fetch the author's books to know how many books there are
// 		  const authorBooks = await readContract({
// 			contract: contract1,
// 			method: 'getAuthorBooks',
// 		  });

// 		  // Loop through each book ID, incrementing by 1 or 2
// 		  for (let i = 0; i < authorBooks.length; i += 1) {
// 			const bookId = i+1;
  
// 			try {
// 			  const book = prepareContractCall({
// 				contract: contract1,
// 				method: 'getPurchasedBookData',
// 				params: [bookId],
// 			  });
  
//   				console.log(bookId,book)
// 			  // Check if the book data returned is valid
// 			  if (isValidBook(book)) {
// 				const title = decodeBytes(book.title);
// 				const content = decodeBytes(book.content);
// 				const date = decodeBytes(book.published_date);
// 				const authorName = decodeBytes(book.author_name);
// 				const price = book.price.toString();
// 				const status = book.status === 1 ? 'Available' : 'Not Available';
  
// 				cleanPurchasedBooks.push(
// 				  <li key={bookId}>
// 					<h2>{title}</h2>
// 					<details>
// 					  <summary>Content</summary>
// 					  <time dateTime={date}>Published on {date}</time>
// 					  <p>Author: {authorName}</p>
// 					  <p>Pricing: ${price}</p>
// 					  <p>{content}</p>
// 					</details>
// 					<p>Status: {status}</p>
// 				  </li>
// 				);
// 			  }
  
// 			} catch (error) {
// 			  // This might be a book that wasn't purchased by the user
// 			  console.warn(`Book with ID ${bookId} might not have been purchased by the user.`);
// 			}
// 		  }
  
// 		  setPurchasedBooks(cleanPurchasedBooks);
// 		} catch (error) {
// 		  console.error('Error fetching purchased books:', error);
// 		}
// 	  };
  
// 	  fetchPurchasedBooks();
// 	}, [activeAccount, author]);
  
// 	function decodeBytes(bytesData) {
// 	  return Buffer.from(bytesData.slice(2), 'hex').toString();
// 	}
  
// 	function isValidBook(book) {
// 	  return book && book.author !== '0x0000000000000000000000000000000000000000' && book.title && book.title.length > 0;
// 	}
  
// 	return (
// 	  <div>
// 		<h1>Purchased Books</h1>
// 		<ul>{purchasedBooks.length > 0 ? purchasedBooks : <p>No books purchased yet.</p>}</ul>
// 	  </div>
// 	);
//   };

const BookList = ({ isPublishTransacted, author, activeAccount }) => {
  const [bookList, setBookList] = useState([]);
  const { mutate: sendAndConfirmTx } = useSendAndConfirmTransaction();

  const handleBuyBook = (bookId, price) => {
    try {
      if (!activeAccount) {
        alert("Please connect your wallet to purchase the book.");
        return;
      }

      const priceInWei = ethers.parseUnits(price.toString(), "ether");

      const transaction = prepareContractCall({
        contract: contract1,
        method: "buyBook",
        params: [bookId],
        value: priceInWei.toString(), // Convert price to wei
      });

      sendAndConfirmTx(transaction, {
        onSuccess: () => {
          alert("Book purchased successfully!");
        },
        onError: (error) => {
          console.error("Purchase failed:", error);
          alert("Purchase failed.");
        },
      });
    } catch (error) {
      console.error("Purchase failed:", error);
      alert("Purchase failed.");
    }
  };

  useEffect(() => {
    const cleanBookList = [];
    const handleBookList = async () => {
      const books = await readContract({
        contract: contract1,
        method: "getAuthorBooks",
      });

      for (let book = 0; book < books.length; book++) {
        const title = Buffer.from(books[book].title.slice(2), "hex").toString();
        const content = Buffer.from(
          books[book].content.slice(2),
          "hex"
        ).toString();
        const date = Buffer.from(
          books[book].published_date.slice(2),
          "hex"
        ).toString();
        const price = books[book].price;
        const status = books[book].status;

        cleanBookList.push(
          <li key={book}>
            <h2>{title}</h2>
            <details>
              <summary>Content</summary>
              <time dateTime={date}>Published on {date}</time>
              <p>Pricing: ${price}</p>
              <p>{content}</p>
            </details>
            {status === 1 && activeAccount?.address !== author && (
              <button onClick={() => handleBuyBook(book + 1, price)}>
                Buy Book
              </button>
            )}
          </li>
        );
      }
      setBookList(cleanBookList);
    };
    handleBookList();
  }, [isPublishTransacted, activeAccount, author]);

  return (
    <div>
      <h1>Author's Published Titles</h1>
      <ul className="books">{bookList ? bookList : ""}</ul>
    </div>
  );
};

const AdditionalInfo = ({ author, activeAccount }) => {
  if (activeAccount === undefined) {
    return (
      <>
        <h2>Your wallet is not connected. Please connect.</h2>
        {author ? <h2>Author's address: {author}</h2> : ""}
        <h2>Smart Contract Address: {contract1.address}</h2>
      </>
    );
  }
  return (
    <>
      <h2>Currently Connected Wallet Address: {activeAccount.address}</h2>
      {author ? <h2>Author's address: {author}</h2> : ""}
      <h2>Smart Contract Address: {contract1.address}</h2>
    </>
  );
};

async function submitFormDelay() {
  await new Promise((res) => setTimeout(res, 1000));
}

const Submit = ({ isPending }) => {
  const [pending, setNoPending] = useState(false);

  async function handleSubmit() {
    setNoPending(isPending);
    console.log("Receipt", isPending);
    await submitFormDelay();
    setNoPending(false);
  }
  return (
    <button type="submit" onClick={handleSubmit}>
      {pending ? "Publishing..." : "Publish"}
    </button>
  );
};

const Status = ({ status }) => {
  if (status === undefined) {
    return "❎ Only author can publish books";
  }
  if (status.status === "success") {
    return "✅";
  }
  return "❎ Only author can publish books";
};

const PublishBook = ({ author }) => {
  const { mutate: sendAndConfirmTx, data: transactReceipt } =
    useSendAndConfirmTransaction();
  const [formData, setFormData] = useState({
    title_: "",
    content_: "",
    authorname_: "",
    date_: "",
    purchase_counter_: 10,
    price_: 0,
    bookstatus_: 0,
  });

  const activeAccount = useActiveAccount();
  const isAuthor = activeAccount?.address === author;

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("formData before submission", formData);

    let status = 0;
    if (formData.bookstatus_ !== "NotAvailable") {
      status = 1;
    }
    console.log("Contract1", contract1);
    const transaction = prepareContractCall({
      contract: contract1,
      method: "publishBook",
      params: [
        formData.title_,
        formData.content_,
        formData.authorname_,
        formData.date_.toString(),
        Number.parseInt(formData.purchase_counter_),
        Number.parseInt(formData.price_),
        status,
      ],
      blockTag: "latest",
      timeout: 60,
    });
    sendAndConfirmTx(transaction);
    setFormData({
      title_: "",
      content_: "",
      authorname_: "",
      date_: "",
      purchase_counter_: 10,
      price_: 0,
      bookstatus_: 0,
    });
  };

  if (!isAuthor) {
    return (
      <>
        <h1>Welcome to my humble abode!</h1>
        <BookList
          isPublishTransacted={true}
          author={author}
          activeAccount={activeAccount}
        />
        
      </>
    );
  }

  return (
    <>
      <BookList
        isPublishTransacted={transactReceipt?.status === "success"}
        author={author}
        activeAccount={activeAccount}
      />
      <h1>Publishing a new book? Go here!</h1>
      <h2>🥴 Requires author-ization. No pun intended 🤣</h2>
      <h2>
        Last Transaction Status: <Status status={transactReceipt} />
      </h2>
      {transactReceipt ? <h3>From: {transactReceipt.from}</h3> : ""}
      {transactReceipt ? <h3>To: {transactReceipt.to}</h3> : ""}
      {transactReceipt ? (
        <h3>Transaction Hash: {transactReceipt.transactionHash}</h3>
      ) : (
        ""
      )}
      {transactReceipt ? <h3>Block Hash: {transactReceipt.blockHash}</h3> : ""}
      <form
        className="form-container"
        onSubmit={(e) => {
          handleSubmit(e);
        }}
      >
        <label>
          Title:
          <input
            type="text"
            value={formData.title_}
            onChange={(e) =>
              setFormData({ ...formData, title_: e.target.value })
            }
            required
          />
        </label>
        <label>
          Author name:
          <input
            type="text"
            value={formData.authorname_}
            onChange={(e) =>
              setFormData({ ...formData, authorname_: e.target.value })
            }
            required
          />
        </label>
        <label>
          Date published:
          <input
            type="date"
            value={formData.date_}
            onChange={(e) =>
              setFormData({ ...formData, date_: e.target.value })
            }
            required
          />
        </label>
        <label>
          Price in USD:
          <input
            type="number"
            value={formData.price_}
            onChange={(e) =>
              setFormData({ ...formData, price_: e.target.value })
            }
            required
          />
        </label>
        <label>
          Number of copies:
          <input
            type="number"
            value={formData.purchase_counter_}
            onChange={(e) =>
              setFormData({ ...formData, purchase_counter_: e.target.value })
            }
            required
          />
        </label>
        <label>Set Availability</label>
        <select
          value={formData.bookstatus_}
          onChange={(e) =>
            setFormData({ ...formData, bookstatus_: e.target.value })
          }
          required
        >
          <option value="Available">Available</option>
          <option value="Unavailable">Unavailable</option>
        </select>
        <label>Content</label>
        <label>
          <textarea
            value={formData.content_}
            onChange={(e) =>
              setFormData({ ...formData, content_: e.target.value })
            }
            rows={20}
            cols={100}
            required
          />
        </label>
        <Submit isPending={transactReceipt} />
      </form>
    </>
  );
};

const AppBase = () => {
  const [author, setAuthor] = useState(undefined);
  const activeAccount = useActiveAccount();

  useEffect(() => {
    const handleAuthor = async () => {
      const author = await readContract({
        contract: contract1,
        method: "author",
      });

      setAuthor(author);
    };
    handleAuthor();
  }, []);

  return (
    <div className="container">
      <AdditionalInfo author={author} activeAccount={activeAccount} />
      <ConnectEmbed
        chain={sepolia}
        modalSize={"wide"}
        client={client}
        wallets={wallets}
      />
      <PublishBook author={author} />
	  <PurchasedBook bookId={1} activeAccount={activeAccount} />
    </div>
  );
};

const App = () => {
  return (
    <ThirdwebProvider>
      <AppBase />
    </ThirdwebProvider>
  );
};

export default App;
