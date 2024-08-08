// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract BookShelf {
    enum BookStatus {
        NotAvailable,
        Available
    }

    struct BookMetadata {
        address author;
        uint256 bookId;
        uint8 price;
        bytes title;
        bytes author_name;
        bytes published_date;
        bytes content;
        BookStatus status;
        uint256 purchase_counter;
    }

    mapping(address => BookMetadata[]) private authorBooks;
    mapping(address => mapping(uint256 => BookMetadata)) private purchasedBooks;
    address payable public author;

    event BookPurchased(uint256 bookId, address buyer);

    constructor() payable {
        author = payable(msg.sender);
    }

    function publishBook(
        string memory title_,
        string memory content_,
        string memory authorname_,
        string memory date_,
        uint256 purchase_counter_,
        uint8 price_,
        BookStatus bookstatus_
    ) external {
        require(msg.sender == author, "Only author can publish books");
        uint256 next_book_id = authorBooks[author].length + 1;
        if (purchase_counter_ == 0) {
            bookstatus_ = BookStatus.NotAvailable;
        }
        BookMetadata memory book = BookMetadata({
            title: bytes(title_),
            content: bytes(content_),
            author: author,
            author_name: bytes(authorname_),
            purchase_counter: purchase_counter_,
            published_date: bytes(date_),
            status: bookstatus_,
            bookId: next_book_id,
            price: price_
        });
        authorBooks[author].push(book);
    }

    function getAuthorBooks() public view returns (BookMetadata[] memory) {
        return authorBooks[author];
    }

    function buyBook(uint256 bookId) external payable {
        require(bookId > 0 && bookId <= authorBooks[author].length, "Invalid book ID");
        BookMetadata storage book = authorBooks[author][bookId - 1];
        require(book.status == BookStatus.Available, "Book is not available");
        require(msg.value >= book.price * 1 ether, "Insufficient payment");
        book.purchase_counter--;
        if (book.purchase_counter == 0) {
            book.status = BookStatus.NotAvailable;
        }
        author.transfer(msg.value);
        purchasedBooks[msg.sender][bookId] = book;
        emit BookPurchased(bookId, msg.sender);
    }

    function updateBookAvailability(uint256 bookId, uint256 newPurchaseCounter) external {
        require(msg.sender == author, "Only author can update book availability");
        require(bookId > 0 && bookId <= authorBooks[author].length, "Invalid book ID");
        BookMetadata storage book = authorBooks[author][bookId - 1];
        book.purchase_counter = newPurchaseCounter;
        book.status = newPurchaseCounter > 0 ? BookStatus.Available : BookStatus.NotAvailable;
    }

    function getPurchasedBookData(uint256 bookId) external view returns (BookMetadata memory) {
        require(bookId > 0 && bookId <= authorBooks[author].length, "Invalid book ID");
        return purchasedBooks[msg.sender][bookId];
    }
}